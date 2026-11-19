"""第 0 步：处理一个抽样片段。用法：python segment.py <片段ID> <集> <起始帧> <帧数>

输出到 片段/<片段ID>/：
  帧/f0012345.jpg      与腾讯云全帧逐字节一致（逐帧对清单 sha256，不一致即停）
  姿态.jsonl           每帧：是否检出人、左右手指尖坐标（原图像素）与可见度、九宫格各格被人体遮挡的比例
  板面状态.jsonl       九宫格每格的稳定状态：连续 ≥2 秒无新笔画且未被挡（程序线索，不进提示词）
  字词.json            whisper 逐字时间（-ml 1）
  指代候选.jsonl       每处「这里/这个/这边」：说出时刻 ±1 秒内指尖停顿最明显的至多 3 帧 + 手部裁片
  裁片/                700×700 手部裁片（从原帧裁，质量 95）
  摘要.json            参数、计数、耗时

所有阈值写在 PARAMS 里并随结果保存；程序判断只当线索，不当答案。
"""
import hashlib
import json
import re
import subprocess
import sys
import time
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np

ROOT = Path(__file__).resolve().parent
BASE = ROOT.parent
PARAMS = {
    'version': 'step0-v1',
    'poseWidth': 960,
    'diffWidth': 405,                 # 板面比较用的缩小宽度
    'pixelDiff': 14,                  # 灰度差阈值（缩小图）
    'changedPixelsPerCell': 12,       # 一格内（人体掩膜外）变化像素数超过即算「有新笔画/变化」
    'maskThreshold': 0.3,
    'maskDilatePx': 6,                # 缩小图上的人体掩膜膨胀
    'occludedFraction': 0.05,         # 一格被人体盖住超过 5% 算「被挡」
    'stableFrames': 60,               # 2 秒（30 fps）
    'sceneCutFraction': 0.30,         # 全画面变化像素超过 30% 视作切镜头，状态重置
    'subtitleBand': 0.85,             # 只看画面上部 85%，避开底部字幕
    'deixis': ['这里', '这个', '这边'],
    'deixisWindowSec': 1.0,
    'maxPauseFrames': 3,
    'handCrop': 700,
    'tipVisibility': 0.3,
}
LM = {'左': (15, 19), '右': (16, 20)}   # 手腕、食指尖


def manifest(ep):
    m = {}
    for line in open(BASE / '全帧-20261107' / '清单' / f'{ep}.tsv'):
        f, _, h = line.rstrip('\n').split('\t')
        m[int(f)] = h
    return m


def frames(ep, start, n):
    """与 run.py 完全相同的解码命令；逐帧产出 (帧号, JPG 字节)。"""
    p = subprocess.Popen(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-threads', '3', '-i', str(BASE / '视频' / f'{ep}.mp4'),
                          '-an', '-vf', f"select='gte(n,{start})'", '-fps_mode', 'passthrough', '-q:v', '2',
                          '-pix_fmt', 'yuvj420p', '-c:v', 'mjpeg', '-f', 'image2pipe', '-'], stdout=subprocess.PIPE)
    buf, idx = b'', start
    try:
        while idx < start + n:
            chunk = p.stdout.read(1 << 20)
            if not chunk:
                break
            buf += chunk
            while idx < start + n:
                e = buf.find(b'\xff\xd9')
                if e < 0:
                    break
                img, buf = buf[:e + 2], buf[e + 2:]
                yield idx, img
                idx += 1
    finally:
        p.kill()


def cells_of(mask_or_bool, h):
    """把缩小图（只取上部 85%）切成 3×3，返回每格的均值（行优先，格号 1–9）。"""
    H, W = mask_or_bool.shape
    out = []
    for r in range(3):
        for c in range(3):
            out.append(float(mask_or_bool[r * H // 3:(r + 1) * H // 3, c * W // 3:(c + 1) * W // 3].mean()))
    return out


def whisper_words(ep, start, n, fps, outdir):
    wav = outdir / '音频.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{start / fps:.3f}', '-t', f'{n / fps:.3f}', '-i',
                    str(BASE / '视频' / f'{ep}.mp4'), '-vn', '-ac', '1', '-ar', '16000', str(wav)], check=True)
    subprocess.run(['whisper-cli', '-m', str(BASE / '模型' / 'whisper.cpp' / 'ggml-large-v3-turbo.bin'), '-l', 'zh',
                    '-ml', '1', '-oj', '-of', str(outdir / '字词'), '-t', '4', '-np', str(wav)], check=True)
    wav.unlink()
    data = json.loads((outdir / '字词.json').read_text())
    toks = []
    for s in data['transcription']:
        t = s['text'].strip()
        if t:
            toks.append((t, s['offsets']['from'] / 1000, s['offsets']['to'] / 1000))
    return toks


def deixis(toks):
    """在逐字文本里找指代词，返回 (词, 片段内秒, 上下文)。"""
    text, starts = '', []
    for t, a, b in toks:
        for ch in t:
            text += ch
            starts.append(a)
    hits = []
    for w in PARAMS['deixis']:
        for m in re.finditer(w, text):
            i = m.start()
            hits.append({'词': w, '秒': round(starts[i], 2), '上下文': text[max(0, i - 12): i + 14]})
    return sorted(hits, key=lambda x: x['秒'])


def main():
    sid, ep, start, n = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    out = ROOT / '片段' / sid
    if (out / '摘要.json').exists():
        raise SystemExit(f'{sid} 已处理过，不覆盖')
    (out / '帧').mkdir(parents=True, exist_ok=True)
    (out / '裁片').mkdir(exist_ok=True)
    t0 = time.time()
    fps = eval(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                        'stream=r_frame_rate', '-of', 'csv=p=0', str(BASE / '视频' / f'{ep}.mp4')]).decode().strip())
    man = manifest(ep)
    opts = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(BASE / '模型' / 'mediapipe' / 'pose_landmarker_full.task')),
        running_mode=mp.tasks.vision.RunningMode.VIDEO, num_poses=1, min_pose_detection_confidence=.35,
        min_pose_presence_confidence=.35, min_tracking_confidence=.35, output_segmentation_masks=True)
    pose_log = (out / '姿态.jsonl').open('w')
    prev = None
    run = [0] * 9          # 每格当前「静止且未挡」连续帧数
    run_start = [None] * 9
    states = []
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * PARAMS['maskDilatePx'] + 1,) * 2)
    count = 0
    with mp.tasks.vision.PoseLandmarker.create_from_options(opts) as det:
        for idx, jpg in frames(ep, start, n):
            if hashlib.sha256(jpg).hexdigest() != man[idx]:
                raise SystemExit(f'{ep} 第 {idx} 帧与云端清单不一致，停止')
            (out / '帧' / f'f{idx:07d}.jpg').write_bytes(jpg)
            img = cv2.imdecode(np.frombuffer(jpg, np.uint8), cv2.IMREAD_COLOR)
            H, W = img.shape[:2]
            ph = round(H * PARAMS['poseWidth'] / W)
            small = cv2.resize(img, (PARAMS['poseWidth'], ph), interpolation=cv2.INTER_AREA)
            res = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(small, cv2.COLOR_BGR2RGB)),
                                       round((idx - start) * 1000 / fps))
            dw = PARAMS['diffWidth']; dh = round(H * dw / W); band = int(dh * PARAMS['subtitleBand'])
            gray = cv2.cvtColor(cv2.resize(img, (dw, dh), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)[:band].astype(np.int16)
            mask = np.zeros((band, dw), np.uint8)
            hands = {}
            if res.pose_landmarks:
                if res.segmentation_masks:
                    m = cv2.resize(res.segmentation_masks[0].numpy_view(), (dw, dh))[:band]
                    mask = cv2.dilate((m > PARAMS['maskThreshold']).astype(np.uint8), k)
                lm = res.pose_landmarks[0]
                for side, (wi, ti) in LM.items():
                    tip = lm[ti]
                    hands[side] = {'指尖': [round(tip.x * W, 1), round(tip.y * H, 1)], '腕': [round(lm[wi].x * W, 1), round(lm[wi].y * H, 1)],
                                   '可见度': round(tip.visibility, 3)}
            occ = cells_of(mask.astype(np.float32), band)
            changed = [False] * 9
            cut = False
            if prev is not None:
                d = (np.abs(gray - prev) > PARAMS['pixelDiff'])
                cut = bool(d.mean() > PARAMS['sceneCutFraction'])
                d = d & (mask == 0)
                counts = cells_of(d.astype(np.float32), band)
                cell_px = (band // 3) * (dw // 3)
                changed = [bool(c * cell_px > PARAMS['changedPixelsPerCell']) for c in counts]
            for c in range(9):
                quiet = not cut and not changed[c] and occ[c] <= PARAMS['occludedFraction']
                if quiet:
                    if run[c] == 0:
                        run_start[c] = idx
                    run[c] += 1
                if not quiet or idx == start + n - 1:
                    if run[c] >= PARAMS['stableFrames']:
                        a, b = run_start[c], run_start[c] + run[c] - 1
                        states.append({'格': c + 1, '起': a, '止': b, '代表帧': (a + b) // 2, '切镜头结束': cut})
                    run[c] = 0
            prev = gray
            pose_log.write(json.dumps({'f': idx, '有人': bool(res.pose_landmarks), '手': hands, '遮挡': [round(x, 3) for x in occ],
                                       '变化格': [c + 1 for c in range(9) if changed[c]], '切镜头': cut}, ensure_ascii=False) + '\n')
            count += 1
    pose_log.close()
    if count != n:
        raise SystemExit(f'只解出 {count} 帧，应为 {n}')
    with (out / '板面状态.jsonl').open('w') as fh:
        for s in states:
            fh.write(json.dumps(s, ensure_ascii=False) + '\n')

    # 指代：逐字时间 → 指尖停顿帧 → 手部裁片
    toks = whisper_words(ep, start, n, fps, out)
    pose = {}
    for line in (out / '姿态.jsonl').open():
        r = json.loads(line)
        pose[r['f']] = r
    cands = []
    for h in deixis(toks):
        center = start + round(h['秒'] * fps)
        lo, hi = center - round(PARAMS['deixisWindowSec'] * fps), center + round(PARAMS['deixisWindowSec'] * fps)
        speeds = []
        for f in range(max(lo, start + 1), min(hi, start + n - 1) + 1):
            for side in ('左', '右'):
                a, b = pose.get(f - 1, {}).get('手', {}).get(side), pose.get(f, {}).get('手', {}).get(side)
                if a and b and min(a['可见度'], b['可见度']) >= PARAMS['tipVisibility']:
                    v = float(np.hypot(b['指尖'][0] - a['指尖'][0], b['指尖'][1] - a['指尖'][1]))
                    # 举起的手（指尖高于腕）优先：停顿要在「指」的时候
                    raised = bool(b['指尖'][1] < b['腕'][1])
                    speeds.append((0 if raised else 1, v, f, side))
        speeds.sort()
        picked, used = [], []
        for _, v, f, side in speeds:
            if all(abs(f - u) >= 6 for u in used):
                picked.append({'帧': f, '手': side, '指尖速度像素每帧': round(v, 1)})
                used.append(f)
            if len(picked) >= PARAMS['maxPauseFrames']:
                break
        for p in picked:
            x, y = pose[p['帧']]['手'][p['手']]['指尖']
            img = cv2.imread(str(out / '帧' / f"f{p['帧']:07d}.jpg"))
            H, W = img.shape[:2]; s = PARAMS['handCrop']
            x0 = int(min(max(x - s / 2, 0), W - s)); y0 = int(min(max(y - s / 2, 0), H - s))
            name = f"f{p['帧']:07d}_{p['手']}手.jpg"
            cv2.imwrite(str(out / '裁片' / name), img[y0:y0 + s, x0:x0 + s], [cv2.IMWRITE_JPEG_QUALITY, 95])
            p['裁片'] = name; p['裁片左上'] = [x0, y0]
        cands.append({**h, '中心帧': center, '窗口': [lo, hi], '停顿帧': picked})
    with (out / '指代候选.jsonl').open('w') as fh:
        for c in cands:
            fh.write(json.dumps(c, ensure_ascii=False) + '\n')
    summary = {'片段': sid, '集': ep, '起始帧': start, '帧数': n, 'fps': fps, '参数': PARAMS,
               '稳定状态数': len(states), '指代候选数': len(cands), '有停顿帧的候选': sum(1 for c in cands if c['停顿帧']),
               'whisper字数': sum(len(t) for t, _, _ in toks), '耗时秒': round(time.time() - t0)}
    (out / '摘要.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    main()

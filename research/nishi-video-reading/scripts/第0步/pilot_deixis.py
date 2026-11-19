"""试点指代层：出题 + Kimi 初判。用法：
  python pilot_deixis.py 出题 P17      （须先有 姿态/<集>-上/下.jsonl 和 字幕/语音/<集>-字词.json）
  python pilot_deixis.py 判 P17        （Kimi K3.1 Pro 高档思考 + 小考重测的 v2 提示词，逐题落盘、断点续跑）

出题与小考 B 包完全同法（segment.py + build_exp4.py）：
- 指代词「这里 / 这个 / 这边」取自 whisper 逐字时间；说出时刻 ±1 秒内按指尖停顿选至多 3 帧（举起的手优先）；
- 每个停顿帧给整帧 + 700×700 手部裁片；再从说出时刻前后 5 秒内找指尖所在格人体遮挡 ≤ 5% 的最近一帧，裁 700×700 板面；
- 另出 A 组（说出前后各 1 秒均匀 6 张整帧），只给 Claude 盲标用（同小考标注），Kimi 只看 B 组（同小考 v2 重测）；
- 没有停顿帧（手不在画面 / 姿态没检出）的不出题，直接记「看不出·无停顿帧」；
- 每张图都从原片按帧号解码，并对腾讯云清单 sha256。
不给程序线索（小考证明线索会把两家一起带偏）。Kimi 用 v2（保守版：硬猜 0/39，但确认率只一半），
每一条「是」都要 Claude 看原帧复核后才进笔记；另抽新题由 Claude 盲标，重测 Kimi 的指错与硬猜。
输出：逐帧层同级目录 指代层/试点/<集>/题/<题号>/B/*.jpg、题.json、题目清单.json、Kimi-v2.jsonl
"""
import base64
import hashlib
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2
import numpy as np

MODE, EP = sys.argv[1], sys.argv[2]
_argv = sys.argv
sys.argv = [_argv[0], 'kimi高', 'v2']
from segment import PARAMS, frames, manifest        # noqa: E402
import run_exp4b                                     # noqa: E402  导入即按 kimi高 配置
sys.argv = _argv

ROOT = Path(__file__).resolve().parent
OUT = ROOT / '指代层' / '试点' / EP
CROP = 700
FPS = 30


def cell_of(x, y, w, h):
    return min(int(y / (h / 3)), 2) * 3 + min(int(x / (w / 3)), 2) + 1


def load_pose():
    pose = {}
    for part in ('上', '下'):
        for line in (ROOT / '姿态' / f'{EP}-{part}.jsonl').open():
            r = json.loads(line)
            pose[r['f']] = r
    return pose


def deixis():
    d = json.loads((ROOT.parent / '字幕' / '语音' / f'{EP}-字词.json').read_text())
    text, starts = '', []
    for s in d['transcription']:
        t = s['text'].strip()
        for ch in t:
            text += ch
            starts.append(s['offsets']['from'] / 1000)
    hits = []
    for w in PARAMS['deixis']:
        for m in re.finditer(w, text):
            i = m.start()
            hits.append({'词': w, '秒': round(starts[i], 2), '上下文': text[max(0, i - 12): i + 14]})
    return sorted(hits, key=lambda x: x['秒'])


def video_size():
    # 11-12 复核：原先写死 1620×1080，P01 / P37 / P48 是 1920×1080，指尖格、板面帧、板面裁片都会算错；1620 宽的集结果不变
    import subprocess
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0',
                          str(ROOT.parent / '视频' / f'{EP}.mp4')], capture_output=True, text=True).stdout.strip().split(',')
    return int(out[0]), int(out[1])


def build():
    if (OUT / '题目清单.json').exists():
        raise SystemExit('已出过题，不覆盖')
    VW, VH = video_size()
    pose = load_pose()
    last = max(pose)
    items, need = [], {}
    for h in deixis():
        center = round(h['秒'] * FPS)
        lo, hi = center - FPS, center + FPS
        speeds = []
        for f in range(max(lo, 1), min(hi, last) + 1):
            for side in ('左', '右'):
                a, b = pose.get(f - 1, {}).get('手', {}).get(side), pose.get(f, {}).get('手', {}).get(side)
                if a and b and min(a['可见度'], b['可见度']) >= PARAMS['tipVisibility']:
                    v = float(np.hypot(b['指尖'][0] - a['指尖'][0], b['指尖'][1] - a['指尖'][1]))
                    raised = bool(b['指尖'][1] < b['腕'][1])
                    speeds.append((0 if raised else 1, v, f, side))
        speeds.sort()
        picked, used = [], []
        for _, v, f, side in speeds:
            if all(abs(f - u) >= 6 for u in used):
                picked.append({'帧': f, '手': side, '指尖': pose[f]['手'][side]['指尖']})
                used.append(f)
            if len(picked) >= PARAMS['maxPauseFrames']:
                break
        qid = f'{EP}-D{len(items) + 1:03d}'
        item = {'题号': qid, '词': h['词'], '上下文': h['上下文'], '说出秒': h['秒'], '说出帧': center, '停顿帧': picked}
        if not picked:
            item['预判'] = '看不出·无停顿帧'
            items.append(item)
            continue
        tx, ty = picked[0]['指尖']
        tx, ty = min(max(tx, 0), VW - 1), min(max(ty, 0), VH - 1)
        cell = cell_of(tx, ty, VW, VH)
        board = None
        for dt in range(0, 151):
            for f in (center - dt, center + dt):
                if f in pose and pose[f]['遮挡'][cell - 1] <= 0.05 and not pose[f]['切镜头']:
                    board = f
                    break
            if board is not None:
                break
        item['板面帧'] = board
        item['_指尖格'] = cell          # 只存档，不进提示词
        six = [lo + round(i * (hi - lo) / 5) for i in range(6)]
        item['A整帧'] = six
        for k, f in enumerate(six):
            need.setdefault(f, []).append((qid, 'six', k + 1))
        for p in picked:
            need.setdefault(p['帧'], []).append((qid, 'pause', p))
        if board is not None:
            need.setdefault(board, []).append((qid, 'board', (tx, ty)))
        items.append(item)
    man = manifest(EP)
    order = {it['题号']: it for it in items}
    lo, hi = min(need), max(need)
    got = 0
    for idx, jpg in frames(EP, lo, hi - lo + 1):
        if idx not in need:
            continue
        if hashlib.sha256(jpg).hexdigest() != man[idx]:
            raise SystemExit(f'{EP} 第 {idx} 帧与云端清单不一致，停止')
        img = cv2.imdecode(np.frombuffer(jpg, np.uint8), cv2.IMREAD_COLOR)
        H, W = img.shape[:2]
        if (W, H) != (VW, VH):
            raise SystemExit(f'{EP} 第 {idx} 帧尺寸 {W}×{H} 与 ffprobe {VW}×{VH} 不一致，停止')
        for qid, kind, info in need[idx]:
            d = OUT / '题' / qid / 'B'
            d.mkdir(parents=True, exist_ok=True)
            if kind == 'six':
                da = OUT / '题' / qid / 'A'
                da.mkdir(parents=True, exist_ok=True)
                cv2.imwrite(str(da / f'{info}-整帧-f{idx:07d}.jpg'), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
            elif kind == 'pause':
                k = [p['帧'] for p in order[qid]['停顿帧']].index(idx) + 1
                cv2.imwrite(str(d / f'{k}-停顿帧-f{idx:07d}.jpg'), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
                x, y = info['指尖']
                x0 = int(min(max(x - CROP / 2, 0), W - CROP)); y0 = int(min(max(y - CROP / 2, 0), H - CROP))
                cv2.imwrite(str(d / f'{k}-手部裁片-f{idx:07d}.jpg'), img[y0:y0 + CROP, x0:x0 + CROP], [cv2.IMWRITE_JPEG_QUALITY, 95])
            else:
                tx, ty = info
                x0 = int(min(max(tx - CROP / 2, 0), W - CROP)); y0 = int(min(max(ty - CROP / 2, 0), H - CROP))
                cv2.imwrite(str(d / f'9-板面裁片-f{idx:07d}.jpg'), img[y0:y0 + CROP, x0:x0 + CROP], [cv2.IMWRITE_JPEG_QUALITY, 95])
                da = OUT / '题' / qid / 'A'
                da.mkdir(parents=True, exist_ok=True)
                cv2.imwrite(str(da / f'7-板面整帧-f{idx:07d}.jpg'), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        got += 1
    for it in items:
        if it['停顿帧']:
            (OUT / '题' / it['题号'] / '题.json').write_text(json.dumps(it, ensure_ascii=False, indent=1) + '\n')
    (OUT / '题目清单.json').write_text(json.dumps(items, ensure_ascii=False, indent=1) + '\n')
    print(EP, '指代词', len(items), '出题', sum(1 for i in items if i['停顿帧']), '无停顿帧', sum(1 for i in items if not i['停顿帧']),
          '有板面裁片', sum(1 for i in items if i.get('板面帧') is not None), '解码帧', got)


def judge():
    qs = [q for q in json.loads((OUT / '题目清单.json').read_text()) if q['停顿帧']]
    outp = OUT / 'Kimi-v2.jsonl'
    done = {json.loads(l)['题号'] for l in outp.open()} if outp.exists() else set()

    def run(q):
        d = OUT / '题' / q['题号'] / 'B'
        content = [{'type': 'text', 'text': run_exp4b.prompt(q)}]
        for f in sorted(d.glob('*.jpg')):
            content.append({'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,' + base64.b64encode(f.read_bytes()).decode()}})
        t = time.time()
        try:
            r = run_exp4b.call(content)
        except Exception as e:
            print(q['题号'], '出错', str(e)[:150], flush=True)
            return
        text = r['choices'][0]['message'].get('content') or ''
        m = re.search(r'\{.*\}', text, re.S)
        try:
            parsed = json.loads(m.group(0)) if m else None
        except Exception:
            parsed = None
        rec = {'题号': q['题号'], '答': parsed, '原始回答': text, 'usage': r.get('usage'), '图数': len(content) - 1, '秒': round(time.time() - t, 1)}
        with outp.open('a') as fh:
            fh.write(json.dumps(rec, ensure_ascii=False) + '\n')

    todo = [q for q in qs if q['题号'] not in done]
    print(EP, '待判', len(todo), flush=True)
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(run, todo))
    res = [json.loads(l) for l in outp.open()]
    pt = sum((x['usage'] or {}).get('prompt_tokens', 0) for x in res)
    ct = sum((x['usage'] or {}).get('completion_tokens', 0) for x in res)
    from collections import Counter
    print(EP, f'已判 {len(res)}/{len(qs)}，解析失败 {sum(x["答"] is None for x in res)}；输入 {pt}，输出 {ct} token；',
          dict(Counter((x['答'] or {}).get('是指代') for x in res)))


if __name__ == '__main__':
    {'出题': build, '判': judge}[MODE]()

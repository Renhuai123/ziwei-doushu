"""苹果识别第二版：整帧识别，只留叠图范围内的字。用法：python overlay_vision2.py P17 [P19 ...]

第一版（overlay_vision.py）裁小块再识别，彩框把叠图切碎、窄块苹果读不出，定稿的字只读到 39%，不能用。
第二版：整帧交 vision_ocr；每行文字的框中心落在「叠图白块（膨胀 25 像素）」里、且在画面上部 85%（避开字幕）才保留；
去掉台标水印「@程心学」及其误读。取哪些帧同第一版（代表帧 + 状态内有变化的起止帧）。
输出：叠图转写/苹果识别2/<集>.jsonl，每行 {编号, 帧, 秒, 行: [{字, 可信}]}
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
OUT = ROOT / '叠图转写' / '苹果识别2'
FR = OUT / '帧'
FR.mkdir(parents=True, exist_ok=True)
OCR = ROOT / 'vision_ocr' / 'vision_ocr'
WM = re.compile(r'@|程心|心学')


def frame(ep, sec):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(sec), '-i', str(ROOT.parent / '视频' / f'{ep}.mp4'), '-frames:v', '1',
                        '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True)
    return cv2.imdecode(np.frombuffer(p.stdout, np.uint8), cv2.IMREAD_COLOR) if p.stdout else None


def ov_mask(im):
    h = im.shape[0]
    a = im.astype(np.int16)
    mn, mx = a.min(2), a.max(2)
    white = ((mn > 190) & (mx - mn < 40)).astype(np.uint8)
    white[int(h * 0.85):] = 0
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, 8)
    m = np.zeros(im.shape[:2], np.uint8)
    for i in range(1, n):
        x, y, w, hh, area = st[i]
        if area >= 0.004 * white.size and area / (w * hh) >= 0.6:
            m[y:y + hh, x:x + w] = 1
    return cv2.dilate(m, np.ones((51, 51), np.uint8)) > 0


def main():
    for ep in sys.argv[1:]:
        sts = json.loads((ROOT / '叠图状态' / f'{ep}.json').read_text())
        inner = set()
        rf = ROOT / '叠图状态' / f'复查-{ep}.json'
        if rf.exists():
            for r in json.loads(rf.read_text()):
                if max([x for x in (r.get('起帧块差'), r.get('止帧块差')) if x is not None] or [0]) > 25:
                    inner.add(r['编号'])
        jobs = []
        for s in sts:
            jobs.append((s['编号'], '代表', s['代表秒']))
            if s['编号'] in inner:
                jobs += [(s['编号'], '起', s['起']), (s['编号'], '止', s['止'])]
        masks, paths = {}, []
        for k, kind, sec in jobs:
            p = FR / f'{k}_{kind}.jpg'
            im = cv2.imread(str(p)) if p.exists() else None
            if im is None:
                im = frame(ep, sec)
                if im is None:
                    continue
                cv2.imwrite(str(p), im, [cv2.IMWRITE_JPEG_QUALITY, 95])
            masks[str(p)] = (ov_mask(im), im.shape[:2])
            paths.append((k, kind, sec, str(p)))
        res = {}
        for i in range(0, len(paths), 30):
            out = subprocess.run([str(OCR), *[x[3] for x in paths[i:i + 30]]], capture_output=True, text=True).stdout
            for line in out.splitlines():
                r = json.loads(line)
                res[r['图']] = r['行']
        with (OUT / f'{ep}.jsonl').open('w') as fh:
            for k, kind, sec, p in paths:
                m, (H, W) = masks[p]
                keep = []
                for x in res.get(p, []):
                    bx, by, bw, bh = x['框']
                    cx, cy = int((bx + bw / 2) * W), int((1 - by - bh / 2) * H)
                    if 0 <= cy < H and 0 <= cx < W and m[cy, cx] and not WM.search(x['字']):
                        keep.append({'字': x['字'], '可信': round(x['可信'], 3)})
                fh.write(json.dumps({'编号': k, '帧': kind, '秒': sec, '行': keep}, ensure_ascii=False) + '\n')
        print(ep, '帧', len(paths), flush=True)


if __name__ == '__main__':
    main()

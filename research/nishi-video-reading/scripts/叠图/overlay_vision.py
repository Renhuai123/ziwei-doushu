"""苹果文字识别（Vision，本机）核对全部叠图截图。用法：python overlay_vision.py P17 [P19 ...]

对每个叠图状态取帧：代表帧（全部状态）；复查里「状态内部有变化」的，再取起始帧、结束帧。
每帧只裁叠图区域（白色矩形块，口径同 overlay2 / overlay_recheck），放大 2 倍，交 vision_ocr 读字。
输出：叠图转写/苹果识别/<集>.jsonl，每行 {编号, 帧: 代表/起/止, 秒, 块: [{框, 行: [{字, 可信}]}]}
帧和裁图存 叠图转写/苹果识别/图/，可复查。
"""
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
OUT = ROOT / '叠图转写' / '苹果识别'
IMG = OUT / '图'
IMG.mkdir(parents=True, exist_ok=True)
OCR = ROOT / 'vision_ocr' / 'vision_ocr'


def frame(ep, sec):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(sec), '-i', str(ROOT.parent / '视频' / f'{ep}.mp4'), '-frames:v', '1',
                        '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True)
    return cv2.imdecode(np.frombuffer(p.stdout, np.uint8), cv2.IMREAD_COLOR) if p.stdout else None


def boxes(im):
    h = im.shape[0]
    a = im[: int(h * 0.85)].astype(np.int16)
    mn, mx = a.min(2), a.max(2)
    white = cv2.morphologyEx(((mn > 190) & (mx - mn < 40)).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, 8)
    return [tuple(int(v) for v in st[i][:4]) for i in range(1, n)
            if st[i][4] >= 0.004 * white.size and st[i][4] / (st[i][2] * st[i][3]) >= 0.8]


def main():
    for ep in sys.argv[1:]:
        sts = json.loads((ROOT / '叠图状态' / f'{ep}.json').read_text())
        inner = {}
        rf = ROOT / '叠图状态' / f'复查-{ep}.json'
        if rf.exists():
            for r in json.loads(rf.read_text()):
                b = max([x for x in (r.get('起帧块差'), r.get('止帧块差')) if x is not None] or [0])
                if b > 25:
                    inner[r['编号']] = True
        jobs = []
        for s in sts:
            jobs.append((s['编号'], '代表', s['代表秒']))
            if s['编号'] in inner:
                jobs += [(s['编号'], '起', s['起']), (s['编号'], '止', s['止'])]
        crops, meta = [], []
        for k, kind, sec in jobs:
            im = frame(ep, sec)
            if im is None:
                continue
            h, w = im.shape[:2]
            for j, (x, y, bw, bh) in enumerate(boxes(im)):
                x0, y0, x1, y1 = max(0, x - 10), max(0, y - 10), min(w, x + bw + 10), min(h, y + bh + 10)
                p = IMG / f'{k}_{kind}_块{j + 1}.png'
                cv2.imwrite(str(p), cv2.resize(im[y0:y1, x0:x1], None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC))
                crops.append(str(p))
                meta.append((k, kind, sec, [x0, y0, x1 - x0, y1 - y0]))
        res = {}
        for i in range(0, len(crops), 40):
            out = subprocess.run([str(OCR), *crops[i:i + 40]], capture_output=True, text=True).stdout
            for line in out.splitlines():
                r = json.loads(line)
                res[r['图']] = r['行']
        rows = {}
        for p, (k, kind, sec, box) in zip(crops, meta):
            rows.setdefault((k, kind), {'编号': k, '帧': kind, '秒': sec, '块': []})['块'].append(
                {'框': box, '行': [{'字': x['字'], '可信': round(x['可信'], 3)} for x in res.get(p, [])]})
        with (OUT / f'{ep}.jsonl').open('w') as fh:
            for v in rows.values():
                fh.write(json.dumps(v, ensure_ascii=False) + '\n')
        print(ep, '帧', len(jobs), '裁块', len(crops), flush=True)


if __name__ == '__main__':
    main()

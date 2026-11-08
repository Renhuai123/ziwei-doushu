"""叠图去重复查：找出「只改了几个字」却被并成重复 / 同一状态的叠图。用法：python overlay_recheck.py P17 [P19 ...]

背景（11-08 做康奈尔样稿时发现）：剪辑常把同一个宫位格只改宫名来举例（如「子女 庚辰」→「命宫 癸未」），
原去重按整块叠图的平均灰度差判断，几个字的变化被平均掉，于是误判为重复。
做法：按原分辨率取叠图区域，切成 24×24 像素小块，取「差异最大那一块」的平均灰度差（块差）。
  - 重复状态：它的代表帧 vs 首次出现那张的代表帧；
  - 同一状态内部：起始秒、结束秒两帧 vs 代表帧。
块差超过阈值的记下来（阈值用 P17 已知漏判的例子校准，写在输出里），这些要拆成新状态补转写。
输出：叠图状态/复查-<集>.json
"""
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
OUT = ROOT / '叠图状态'


def frame(ep, sec):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(sec), '-i', str(ROOT.parent / '视频' / f'{ep}.mp4'), '-frames:v', '1',
                        '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True)
    return cv2.imdecode(np.frombuffer(p.stdout, np.uint8), cv2.IMREAD_COLOR) if p.stdout else None


def mask(im):
    h = im.shape[0]
    a = im[: int(h * 0.85)].astype(np.int16)
    mn, mx = a.min(2), a.max(2)
    white = cv2.morphologyEx(((mn > 190) & (mx - mn < 40)).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, 8)
    m = np.zeros(im.shape[:2], bool)
    for i in range(1, n):
        x, y, w, hh, area = st[i]
        if area >= 0.004 * white.size and area / (w * hh) >= 0.8:
            m[y:y + hh, x:x + w] = True
    return m


def blockdiff(a, b, B=24):
    if a is None or b is None or a.shape != b.shape:
        return None
    m = mask(a) & mask(b)
    if m.sum() < 2000:
        return None
    ga, gb = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY).astype(np.float32), cv2.cvtColor(b, cv2.COLOR_BGR2GRAY).astype(np.float32)
    d = np.abs(ga - gb)
    d[~m] = 0
    H, W = d.shape
    best = 0.0
    for y in range(0, H - B + 1, B // 2):
        for x in range(0, W - B + 1, B // 2):
            mm = m[y:y + B, x:x + B]
            if mm.mean() > 0.9:
                best = max(best, float(d[y:y + B, x:x + B].mean()))
    return best


def main():
    for ep in sys.argv[1:]:
        sts = json.loads((OUT / f'{ep}.json').read_text())
        by = {s['编号']: s for s in sts}
        cache = {}
        get = lambda sec: cache.setdefault(sec, frame(ep, sec))
        rows = []
        for s in sts:
            rep = get(s['代表秒'])
            r = {'编号': s['编号'], '起': s['起'], '止': s['止'], '重复于': s['重复于']}
            if s['重复于']:
                r['对首次块差'] = blockdiff(rep, get(by[s['重复于']]['代表秒']))
            if s['止'] > s['起']:
                r['起帧块差'] = blockdiff(get(s['起']), rep)
                r['止帧块差'] = blockdiff(get(s['止']), rep)
            rows.append(r)
        (OUT / f'复查-{ep}.json').write_text(json.dumps(rows, ensure_ascii=False, indent=0))
        print(ep, '复查', len(rows), flush=True)


if __name__ == '__main__':
    main()

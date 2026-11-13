"""把一集里的电子叠图切成「状态」并去重 → 叠图状态/Pxx.json + 叠图状态/帧/Pxx_s<秒>.jpg。用法：python overlay_states.py P11

1. 叠图段：叠图扫描v2/Pxx.tsv 里分数 ≥ 0.03 的秒，间隔 ≤ 2 秒合并，段长 ≥ 2 秒才算。
2. 段内逐秒（405×270）取叠图掩膜（overlay2 同口径：白色矩形块），掩膜内灰度缩成 64×36 作指纹；
   相邻两秒指纹差（掩膜并集内平均灰度差）> 10 或掩膜面积变化 > 20% → 切成新状态。
3. 同一集里指纹与之前某状态差 ≤ 6 且掩膜面积相差 ≤ 15% → 记为「重复」，指回首次出现的状态，不再送模型。
4. 每个新状态取中间那一秒，按原分辨率出一张 JPEG（帧号 = 秒 × 30）。
阈值在看结果前定下，只用于去重省钱，不作结论；重复判定可能把内容相近的两张盘并成一张，报告里会写明。
"""
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
EP = sys.argv[1]
VIDEO = ROOT.parent / '视频' / f'{EP}.mp4'
OUT = ROOT / '叠图状态'
(OUT / '帧').mkdir(parents=True, exist_ok=True)
W, H = 405, 270


def mask_of(rgb):
    h = rgb.shape[0]
    a = rgb[: int(h * 0.85)].astype(np.int16)
    mn, mx = a.min(2), a.max(2)
    white = ((mn > 190) & (mx - mn < 40)).astype(np.uint8)
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, 8)
    m = np.zeros(rgb.shape[:2], bool)
    for i in range(1, n):
        x, y, w, hh, area = st[i]
        if area >= 0.004 * white.size and area / (w * hh) >= 0.8:
            m[y:y + hh, x:x + w] = True  # 取外接矩形，把格内文字也算进来
    return m


def sig(rgb):
    m = mask_of(rgb)
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    g[~m] = 0
    return cv2.resize(g, (64, 36), interpolation=cv2.INTER_AREA), cv2.resize(m.astype(np.float32), (64, 36), interpolation=cv2.INTER_AREA) > 0.5, m.mean()


def diff(a, b):
    ga, ma, aa = a
    gb, mb, ab = b
    u = ma | mb
    if not u.any():
        return 0.0, 0.0
    return float(np.abs(ga - gb)[u].mean()), abs(aa - ab) / max(aa, ab, 1e-6)


def runs():
    v = [float(l.split('\t')[1]) for l in (ROOT / '叠图扫描v2' / f'{EP}.tsv').read_text().splitlines()]
    on = [i for i, x in enumerate(v) if x >= 0.03]
    rs = []
    for s in on:
        if rs and s - rs[-1][1] <= 3:
            rs[-1][1] = s
        else:
            rs.append([s, s])
    return [r for r in rs if r[1] - r[0] + 1 >= 2]


def frames(s0, s1):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(s0), '-i', str(VIDEO), '-t', str(s1 - s0 + 1), '-an',
                        '-vf', f'fps=1,scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
    b = p.stdout
    n = len(b) // (W * H * 3)
    return [np.frombuffer(b[i * W * H * 3:(i + 1) * W * H * 3], np.uint8).reshape(H, W, 3) for i in range(n)]


def main():
    states, firsts = [], []
    for s0, s1 in runs():
        fs = frames(s0, s1)
        if not fs:
            continue
        cur = None
        for k, f in enumerate(fs):
            sg = sig(f)
            if sg[2] < 0.01:  # 这一秒其实没叠图
                cur = None
                continue
            if cur is not None:
                d, da = diff(states[cur]['_sig'], sg)
                if d <= 10 and da <= 0.2:
                    states[cur]['止'] = s0 + k
                    continue
            states.append({'起': s0 + k, '止': s0 + k, '_sig': sg})
            cur = len(states) - 1
    out = []
    for i, st in enumerate(states):
        rep = None
        for j in firsts:
            d, da = diff(states[j]['_sig'], st['_sig'])
            if d <= 6 and da <= 0.15:
                rep = j
                break
        mid = (st['起'] + st['止']) // 2
        st['代表秒'] = mid
        st['帧号'] = mid * 30
        st['编号'] = f'{EP}_s{mid:05d}'
        if rep is None:
            firsts.append(i)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(mid), '-i', str(VIDEO), '-frames:v', '1', '-q:v', '2',
                            str(OUT / '帧' / f'{st["编号"]}.jpg')], check=True)
            st['重复于'] = None
        else:
            st['重复于'] = states[rep]['编号']
        out.append({k: v for k, v in st.items() if k != '_sig'})
    (OUT / f'{EP}.json').write_text(json.dumps(out, ensure_ascii=False, indent=0))
    print(EP, '状态', len(out), '新', sum(o['重复于'] is None for o in out), '秒', sum(o['止'] - o['起'] + 1 for o in out))


if __name__ == '__main__':
    main()

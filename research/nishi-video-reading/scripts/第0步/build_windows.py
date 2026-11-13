"""小考实验 1、2 的窗口（固定种子）。用法：python build_windows.py（须先跑完 10 个片段）

实验 1：每段 6 个窗口 × 12 连续帧，共 60 窗；随机 15%（9 窗）放探针，换帧 5、遮挡 4。
  - 换帧：窗内随机一个位置换成同段 2–5 秒外、指尖位置最接近的帧。
  - 遮挡：窗内随机一帧，只在黑板上（避开白色叠图）找粉笔笔画最多的 220×160 原图像素块，把块内笔画换成黑板底色，像被擦掉。
  - 帧号在调换之后才按顺序烧在图片上方的黑条里（显示的是「该位置应有的帧号」），模型不能靠帧号发现。
实验 2：每段另取连续 3 窗（36 帧），供 Claude 看原帧出逐帧标准答案；与实验 1 窗口不重叠。
输出：小考/实验1/窗口/<窗口ID>/01–12.jpg、小考/实验1/答案.json（探针位置，不给模型）、
      小考/实验2/窗口/<窗口ID>/01–12.jpg、小考/实验2/窗口清单.json
"""
import json
import random
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
SEED = 20261108
WIN = 12
BAND = 44


def load_pose(seg):
    return {r['f']: r for r in map(json.loads, (seg / '姿态.jsonl').open())}


def tip(pose, f):
    hs = pose.get(f, {}).get('手', {})
    pts = [h['指尖'] for h in hs.values() if h['可见度'] >= 0.3]
    return np.array(pts[0]) if pts else None


def burn(img, label):
    h, w = img.shape[:2]
    out = np.zeros((h + BAND, w, 3), np.uint8)
    out[BAND:] = img
    cv2.putText(out, label, (12, 32), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
    return out


def occlude(img, rng):
    """抠掉一块板书：只在黑板上找，把块内粉笔笔画换成这块黑板的底色，像被擦掉。
    黑板 = HSV 色相 35–105、饱和度 ≥18、亮度 60–150（各集黑板从墨绿到青色都在内；皮肤、头发、浅色衣服都不在）。
    入选条件：去掉笔画后 ≥85% 是黑板色；亮的部分是细笔画（7×7 开运算后几乎不剩，衣袖等大块会剩）；笔画占 3%–30%。"""
    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    boardpx = (H >= 35) & (H <= 105) & (S >= 18) & (V >= 60) & (V <= 150)
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    k5, k7 = np.ones((5, 5), np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    bh, bw = 160, 220
    best, pos = -1, None
    for _ in range(800):
        y, x = rng.randint(0, int(h * 0.85) - bh), rng.randint(0, w - bw)
        gb = g[y:y + bh, x:x + bw]
        raw = (gb > np.median(gb) + 45).astype(np.uint8)
        chalk = float(raw.mean())
        if not 0.03 < chalk < 0.30:
            continue
        stroke = cv2.dilate(raw, k5).astype(bool)
        rest = boardpx[y:y + bh, x:x + bw][~stroke]
        if rest.size < 0.5 * bh * bw or rest.mean() < 0.85:
            continue
        if cv2.morphologyEx(raw, cv2.MORPH_OPEN, k7).mean() > 0.01:
            continue
        if chalk > best:
            best, pos = chalk, (x, y)
    if pos is None:
        return None, None
    x, y = pos
    out = img.copy()
    blk = out[y:y + bh, x:x + bw]
    gb = g[y:y + bh, x:x + bw]
    stroke = cv2.dilate((gb > np.median(gb) + 45).astype(np.uint8), k5).astype(bool)
    board = np.median(blk[~stroke & boardpx[y:y + bh, x:x + bw]], 0)
    noise = np.random.default_rng(x * 7 + y).normal(0, 3, blk.shape)
    blk[stroke] = np.clip(board + noise[stroke], 0, 255).astype(np.uint8)
    return out, [x, y, bw, bh]


def main():
    plan = json.loads((ROOT / '分层抽样.json').read_text())
    rng = random.Random(SEED)
    e1, e2 = ROOT / '小考' / '实验1', ROOT / '小考' / '实验2'
    if (e1 / '答案.json').exists():
        raise SystemExit('已建过，不覆盖')
    windows1, windows2 = [], []
    for p in plan['片段']:
        seg = ROOT / '片段' / p['片段']
        a, n = p['起始帧'], p['帧数']
        starts = []
        while len(starts) < 6 + 1:  # 6 个实验 1 窗 + 1 个实验 2 起点（占 3 窗）
            s = rng.randint(a + 60, a + n - 3 * WIN - 60)
            span = 3 * WIN if len(starts) == 6 else WIN
            if all(s + span + 60 <= t or t + 3 * WIN + 60 <= s for t in starts):
                starts.append(s)
        for k, s in enumerate(starts[:6]):
            windows1.append({'窗口': f"{p['片段']}-W{k + 1}", '片段': p['片段'], '层': p['层'], '起': s, '段起': a, '段止': a + n - 1})
        s2 = starts[6]
        for k in range(3):
            windows2.append({'窗口': f"{p['片段']}-R{k + 1}", '片段': p['片段'], '层': p['层'], '起': s2 + k * WIN})
    probe_ids = rng.sample(range(len(windows1)), 9)
    kinds = ['换帧'] * 5 + ['遮挡'] * 4
    rng.shuffle(kinds)
    probes = dict(zip(probe_ids, kinds))
    answers = []
    for i, w in enumerate(windows1):
        seg = ROOT / '片段' / w['片段']
        pose = load_pose(seg)
        d = e1 / '窗口' / w['窗口']
        d.mkdir(parents=True, exist_ok=True)
        frames = list(range(w['起'], w['起'] + WIN))
        src = list(frames)
        ans = {**w, '探针': probes.get(i), '位置': None}
        if probes.get(i) == '换帧':
            pos = rng.randrange(WIN)
            f = frames[pos]
            t0 = tip(pose, f)
            cands = [g for g in range(f - 150, f + 151) if 60 <= abs(g - f) <= 150 and w['段起'] <= g <= w['段止']]
            if t0 is not None:
                cands.sort(key=lambda g: float(np.linalg.norm(tip(pose, g) - t0)) if tip(pose, g) is not None else 1e9)
                pick = cands[0]
            else:
                pick = rng.choice(cands)
            src[pos] = pick
            ans.update({'位置': pos + 1, '换入帧': pick})
        doctored = None
        if probes.get(i) == '遮挡':
            order = list(range(WIN))
            rng.shuffle(order)
            for pos in order:   # 随机位置起找第一张能在黑板上抹的帧
                img2, box = occlude(cv2.imread(str(seg / '帧' / f'f{src[pos]:07d}.jpg')), rng)
                if img2 is not None:
                    ans.update({'位置': pos + 1, '抹掉区域': box}); doctored = img2
                    break
            if doctored is None:
                ans.update({'探针': None, '备注': '整窗没有可抹的黑板，改为无探针窗'})
        for k, f in enumerate(src):
            img = cv2.imread(str(seg / '帧' / f'f{f:07d}.jpg'))
            if doctored is not None and k == ans['位置'] - 1:
                img = doctored
            cv2.imwrite(str(d / f'{k + 1:02d}.jpg'), burn(img, f'#{k + 1:02d}  frame {frames[k]}'), [cv2.IMWRITE_JPEG_QUALITY, 95])
        answers.append(ans)
    (e1 / '答案.json').write_text(json.dumps(answers, ensure_ascii=False, indent=1) + '\n')
    for w in windows2:
        seg = ROOT / '片段' / w['片段']
        d = e2 / '窗口' / w['窗口']
        d.mkdir(parents=True, exist_ok=True)
        for k in range(WIN):
            f = w['起'] + k
            img = cv2.imread(str(seg / '帧' / f'f{f:07d}.jpg'))
            cv2.imwrite(str(d / f'{k + 1:02d}.jpg'), burn(img, f'#{k + 1:02d}  frame {f}'), [cv2.IMWRITE_JPEG_QUALITY, 95])
    (e2 / '窗口清单.json').write_text(json.dumps(windows2, ensure_ascii=False, indent=1) + '\n')
    print('实验1 窗口', len(windows1), '探针', sorted(probes.items()))
    print('实验2 窗口', len(windows2), '帧', len(windows2) * WIN)


if __name__ == '__main__':
    main()

"""实验 3（板书逐格转写）出题。用法：python build_exp3.py

- 从 10 段的板面稳定状态里，每段挑 3 个（固定种子）：该格在代表帧里黑板色 ≥60%、粉笔笔画占 3%–40%，持续 ≥60 帧，同段两两不同格或相隔 ≥10 秒。
- 每个状态 4 种输入：整帧（指明第几格）、格裁片、多帧叠加裁片（稳定期内均匀 15 帧的逐像素中位数）、格裁片 + 稳定期前后 5 秒的 OCR 字幕。
- 30 个里随机 10 个放「擦字探针」：在格裁片上用 build_windows.occlude 抹掉一块粉笔笔画（整帧、裁片、叠加三种输入同处抹），原图另存供出标准答案。
输出：小考/实验3/题/<题号>/整帧.jpg、裁片.jpg、叠加.jpg、原裁片.jpg（探针题才有）、题.json；题目清单.json
"""
import json
import random
import re
from pathlib import Path

import cv2
import numpy as np

from build_windows import occlude

ROOT = Path(__file__).resolve().parent
SEED = 20261108 + 3


def board_frac(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    return float(((H >= 35) & (H <= 105) & (S >= 18) & (V >= 60) & (V <= 150)).mean())


def chalk_frac(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float((g > np.median(g) + 45).mean())


def cell_box(cell, W, H):
    r, c = (cell - 1) // 3, (cell - 1) % 3
    return c * W // 3, r * H // 3, (c + 1) * W // 3, (r + 1) * H // 3


def subtitles(ep, a_sec, b_sec):
    out = []
    for l in open(ROOT.parent / '字幕' / f'{ep}.md'):
        m = re.match(r'\[\d+ (\d+):(\d+):([\d.]+)–(\d+):(\d+):([\d.]+)\] (.*)', l)
        if m:
            s = int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3]); e = int(m[4]) * 3600 + int(m[5]) * 60 + float(m[6])
            if e >= a_sec and s <= b_sec:
                out.append(m[7].strip())
    return out


def main():
    out = ROOT / '小考' / '实验3'
    if (out / '题目清单.json').exists():
        raise SystemExit('已建过，不覆盖')
    rng = random.Random(SEED)
    plan = json.loads((ROOT / '分层抽样.json').read_text())
    items = []
    for p in plan['片段']:
        seg = ROOT / '片段' / p['片段']
        ep = p['集']
        states = [json.loads(l) for l in (seg / '板面状态.jsonl').open()]
        rng.shuffle(states)
        picked = []
        for s in states:
            if s['止'] - s['起'] + 1 < 60:
                continue
            img = cv2.imread(str(seg / '帧' / f"f{s['代表帧']:07d}.jpg"))
            H, W = img.shape[:2]
            x0, y0, x1, y1 = cell_box(s['格'], W, H)
            crop = img[y0:y1, x0:x1]
            if board_frac(crop) < 0.6 or not 0.03 <= chalk_frac(crop) <= 0.40:
                continue
            if any(q['格'] == s['格'] and abs(q['代表帧'] - s['代表帧']) < 300 for q in picked):
                continue
            picked.append({**s, 'box': [x0, y0, x1, y1]})
            if len(picked) == 3:
                break
        for s in picked:
            qid = f'B{len(items) + 1:02d}'
            d = out / '题' / qid
            d.mkdir(parents=True)
            frames = np.linspace(s['起'], s['止'], 15).round().astype(int)
            x0, y0, x1, y1 = s['box']
            stack = np.median(np.stack([cv2.imread(str(seg / '帧' / f'f{f:07d}.jpg'))[y0:y1, x0:x1] for f in frames]), 0).astype(np.uint8)
            full = cv2.imread(str(seg / '帧' / f"f{s['代表帧']:07d}.jpg"))
            subs = subtitles(ep, s['起'] / 30 - 5, s['止'] / 30 + 5)
            items.append({'题号': qid, '片段': p['片段'], '层': p['层'], '集': ep, '格': s['格'], '起': s['起'], '止': s['止'],
                          '代表帧': s['代表帧'], '裁片范围': s['box'], '字幕': subs, '探针': None})
            cv2.imwrite(str(d / '整帧.jpg'), full, [cv2.IMWRITE_JPEG_QUALITY, 95])
            cv2.imwrite(str(d / '裁片.jpg'), full[y0:y1, x0:x1], [cv2.IMWRITE_JPEG_QUALITY, 95])
            cv2.imwrite(str(d / '叠加.jpg'), stack, [cv2.IMWRITE_JPEG_QUALITY, 95])
    for i in rng.sample(range(len(items)), 10):
        it = items[i]
        d = out / '题' / it['题号']
        crop = cv2.imread(str(d / '裁片.jpg'))
        doctored, box = occlude(crop, rng)
        if doctored is None:
            continue
        cv2.imwrite(str(d / '原裁片.jpg'), crop, [cv2.IMWRITE_JPEG_QUALITY, 95])
        cv2.imwrite(str(d / '裁片.jpg'), doctored, [cv2.IMWRITE_JPEG_QUALITY, 95])
        bx, by, bw, bh = box
        stack = cv2.imread(str(d / '叠加.jpg'))
        stack[by:by + bh, bx:bx + bw] = doctored[by:by + bh, bx:bx + bw]
        cv2.imwrite(str(d / '叠加.jpg'), stack, [cv2.IMWRITE_JPEG_QUALITY, 95])
        full = cv2.imread(str(d / '整帧.jpg'))
        x0, y0 = it['裁片范围'][:2]
        full[y0 + by:y0 + by + bh, x0 + bx:x0 + bx + bw] = doctored[by:by + bh, bx:bx + bw]
        cv2.imwrite(str(d / '整帧.jpg'), full, [cv2.IMWRITE_JPEG_QUALITY, 95])
        it['探针'] = {'抹掉区域_裁片坐标': box}
    for it in items:
        (out / '题' / it['题号'] / '题.json').write_text(json.dumps(it, ensure_ascii=False, indent=1) + '\n')
    (out / '题目清单.json').write_text(json.dumps(items, ensure_ascii=False, indent=1) + '\n')
    print('题数', len(items), '探针', sum(1 for i in items if i['探针']))


if __name__ == '__main__':
    main()

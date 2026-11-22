"""实验 2 补充（2b）：专挑「手在活动」的窗口，补足 写 / 指 / 触板 的样本。用法：python build_exp2b.py

实验 2 每段取连续 36 帧，多数是讲者只在说话，「写」「触板」样本太少。
2b 用程序线索选帧（线索只用于选帧，不进提示词）：一帧算「手在活动」= 任一只手指尖可见度 ≥0.3 且指尖高于手腕。
每段取 2 个 12 帧窗口，窗内至少 8 帧手在活动；随机（固定种子）选，避开实验 1、1b、2 用过的帧。单窗、不带上文。
输出：小考/实验2b/窗口/<片段>-A1、A2/01–12.jpg，窗口清单.json
"""
import json
import random
from pathlib import Path

import cv2

from build_windows import WIN, burn, load_pose

ROOT = Path(__file__).resolve().parent
SEED = 20261108 + 2


def active(pose, f):
    for h in pose.get(f, {}).get('手', {}).values():
        if h['可见度'] >= 0.3 and h['指尖'][1] < h['腕'][1]:
            return True
    return False


def main():
    out = ROOT / '小考' / '实验2b'
    if (out / '窗口清单.json').exists():
        raise SystemExit('已建过，不覆盖')
    used = set()
    for a in json.loads((ROOT / '小考' / '实验1' / '答案.json').read_text()) + json.loads((ROOT / '小考' / '实验1b' / '答案.json').read_text()):
        used.update(range(a['起'] - 60, a['起'] + WIN + 60))
    for w in json.loads((ROOT / '小考' / '实验2' / '窗口清单.json').read_text()):
        used.update(range(w['起'] - 60, w['起'] + WIN + 60))
    rng = random.Random(SEED)
    plan = json.loads((ROOT / '分层抽样.json').read_text())
    wins = []
    for p in plan['片段']:
        seg = ROOT / '片段' / p['片段']
        pose = load_pose(seg)
        a0, n = p['起始帧'], p['帧数']
        cands = [s for s in range(a0, a0 + n - WIN, 6)
                 if not any(f in used for f in range(s, s + WIN)) and sum(active(pose, f) for f in range(s, s + WIN)) >= 8]
        picked = []
        rng.shuffle(cands)
        for s in cands:
            if all(abs(s - t) >= 90 for t in picked):
                picked.append(s)
            if len(picked) == 2:
                break
        for k, s in enumerate(sorted(picked)):
            wid = f"{p['片段']}-A{k + 1}"
            d = out / '窗口' / wid
            d.mkdir(parents=True)
            for j in range(WIN):
                img = cv2.imread(str(seg / '帧' / f'f{s + j:07d}.jpg'))
                cv2.imwrite(str(d / f'{j + 1:02d}.jpg'), burn(img, f'#{j + 1:02d}  frame {s + j}'), [cv2.IMWRITE_JPEG_QUALITY, 95])
            wins.append({'窗口': wid, '片段': p['片段'], '层': p['层'], '起': s, '候选窗数': len(cands)})
        if len(picked) < 2:
            print(p['片段'], '只找到', len(picked), '个')
    (out / '窗口清单.json').write_text(json.dumps(wins, ensure_ascii=False, indent=1) + '\n')
    print('实验2b 窗口', len(wins))


if __name__ == '__main__':
    main()

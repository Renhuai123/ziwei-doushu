"""实验 1 加测：40 道探针（每段换帧 2、遮挡 2），量准发现率并比较窗口大小。用法：python build_probes.py

- 每个请求相互独立，模型不知道哪一窗有探针，所以可以全是探针窗来量发现率；误报率仍以实验 1 的 51 个无探针窗为准。
- 换帧有效条件（实验 1 复盘后定）：换入帧与原帧的平均灰度差（405×270）≥ 10，再在满足条件的帧里挑指尖位置最接近的。
- 遮挡用 build_windows.occlude（只抹黑板上的粉笔笔画）。
- 同一批探针同时出两种窗口：12 帧（窗口12/）和探针所在的那半窗 6 帧（窗口6/），两种窗口的探针图逐字节相同。
- 避开实验 1、2 已用的帧。
输出：小考/实验1b/窗口12/<ID>/01–12.jpg、窗口6/<ID>/01–06.jpg、答案.json
"""
import json
import random
from pathlib import Path

import cv2
import numpy as np

from build_windows import WIN, burn, load_pose, occlude, tip

ROOT = Path(__file__).resolve().parent
SEED = 20261108 + 1


def gray(seg, f):
    return cv2.cvtColor(cv2.resize(cv2.imread(str(seg / '帧' / f'f{f:07d}.jpg')), (405, 270)), cv2.COLOR_BGR2GRAY).astype(float)


def main():
    out = ROOT / '小考' / '实验1b'
    if (out / '答案.json').exists():
        raise SystemExit('已建过，不覆盖')
    plan = json.loads((ROOT / '分层抽样.json').read_text())
    used = set()
    for a in json.loads((ROOT / '小考' / '实验1' / '答案.json').read_text()):
        used.update(range(a['起'] - 60, a['起'] + WIN + 60))
    for w in json.loads((ROOT / '小考' / '实验2' / '窗口清单.json').read_text()):
        used.update(range(w['起'] - 60, w['起'] + WIN + 60))
    rng = random.Random(SEED)
    answers = []
    for p in plan['片段']:
        seg = ROOT / '片段' / p['片段']
        pose = load_pose(seg)
        a0, n = p['起始帧'], p['帧数']
        for kind in ['换帧', '换帧', '遮挡', '遮挡']:
            for _ in range(200):
                s = rng.randint(a0 + 200, a0 + n - WIN - 200)
                if any(f in used for f in range(s, s + WIN)):
                    continue
                pos = rng.randrange(WIN)
                frames = list(range(s, s + WIN))
                f = frames[pos]
                imgs = [cv2.imread(str(seg / '帧' / f'f{g:07d}.jpg')) for g in frames]
                rec = {'窗口': f"{p['片段']}-P{len(answers) + 1:02d}", '片段': p['片段'], '层': p['层'], '起': s, '探针': kind, '位置': pos + 1}
                if kind == '换帧':
                    g0 = gray(seg, f)
                    cands = [g for g in range(f - 150, f + 151) if 60 <= abs(g - f) <= 150 and a0 <= g < a0 + n]
                    valid = [(g, float(np.abs(gray(seg, g) - g0).mean())) for g in rng.sample(cands, min(40, len(cands)))]
                    valid = [(g, d) for g, d in valid if d >= 10]
                    if not valid:
                        continue
                    t0 = tip(pose, f)
                    valid.sort(key=lambda x: float(np.linalg.norm(tip(pose, x[0]) - t0)) if t0 is not None and tip(pose, x[0]) is not None else 1e9)
                    g, d = valid[0]
                    imgs[pos] = cv2.imread(str(seg / '帧' / f'f{g:07d}.jpg'))
                    rec.update({'换入帧': g, '像素差': round(d, 1)})
                else:
                    img2, box = occlude(imgs[pos], rng)
                    if img2 is None:
                        continue
                    imgs[pos] = img2
                    rec['抹掉区域'] = box
                used.update(range(s - 60, s + WIN + 60))
                half = 0 if pos < 6 else 6
                rec.update({'六帧起': s + half, '六帧位置': pos - half + 1})
                d12, d6 = out / '窗口12' / rec['窗口'], out / '窗口6' / rec['窗口']
                d12.mkdir(parents=True); d6.mkdir(parents=True)
                for k, im in enumerate(imgs):
                    b = burn(im, f'#{k + 1:02d}  frame {frames[k]}')
                    cv2.imwrite(str(d12 / f'{k + 1:02d}.jpg'), b, [cv2.IMWRITE_JPEG_QUALITY, 95])
                    if half <= k < half + 6:
                        b6 = burn(im, f'#{k - half + 1:02d}  frame {frames[k]}')
                        cv2.imwrite(str(d6 / f'{k - half + 1:02d}.jpg'), b6, [cv2.IMWRITE_JPEG_QUALITY, 95])
                answers.append(rec)
                break
            else:
                print('没找到合格的', p['片段'], kind)
    (out / '答案.json').write_text(json.dumps(answers, ensure_ascii=False, indent=1) + '\n')
    from collections import Counter
    print(len(answers), Counter(a['探针'] for a in answers))


if __name__ == '__main__':
    main()

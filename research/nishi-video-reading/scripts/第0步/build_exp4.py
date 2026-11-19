"""实验 4（指代）出题：每处「这里/这个/这边」做 A、B 两种证据包。用法：python build_exp4.py

取 10 段全部有指尖停顿帧的指代候选（共约 90 处，Fable 设计 100 句，实际不足照实报）。
- A 包（确认稿原设计）：说出时刻 ±1 秒内均匀 6 张整帧 + 1 张板面整帧。
- B 包（Fable 建议）：程序选的指尖停顿帧（至多 3 张整帧）+ 对应 700×700 手部裁片 + 1 张板面裁片。
- 板面图：从说出时刻往前后 5 秒内找指尖所在格「人体遮挡 ≤5%」且离说出时刻最近的一帧；A 包给整帧，B 包裁指尖位置周围 700×700。
  找不到就记「无未遮挡板面」，只给停顿帧。
- 线索（程序算的指尖所在格）单独存，提示词有 / 无线索两版由调用程序决定；线索只用于这个对照实验。
输出：小考/实验4/题/<题号>/A/*.jpg、B/*.jpg、题.json；小考/实验4/题目清单.json
"""
import json
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parent
CROP = 700


def cell_of(x, y, w, h):
    return min(int(y / (h / 3)), 2) * 3 + min(int(x / (w / 3)), 2) + 1


def main():
    out = ROOT / '小考' / '实验4'
    if (out / '题目清单.json').exists():
        raise SystemExit('已建过，不覆盖')
    plan = json.loads((ROOT / '分层抽样.json').read_text())
    items = []
    for p in plan['片段']:
        seg = ROOT / '片段' / p['片段']
        pose = {r['f']: r for r in map(json.loads, (seg / '姿态.jsonl').open())}
        a0, n = p['起始帧'], p['帧数']
        for c in map(json.loads, (seg / '指代候选.jsonl').open()):
            if not c['停顿帧']:
                continue
            qid = f"Q{len(items) + 1:03d}"
            d = out / '题' / qid
            (d / 'A').mkdir(parents=True); (d / 'B').mkdir()
            lo, hi = max(c['窗口'][0], a0), min(c['窗口'][1], a0 + n - 1)
            six = [lo + round(i * (hi - lo) / 5) for i in range(6)]
            first = c['停顿帧'][0]
            tx, ty = pose[first['帧']]['手'][first['手']]['指尖']
            img0 = cv2.imread(str(seg / '帧' / f"f{first['帧']:07d}.jpg"))
            H, W = img0.shape[:2]
            tx, ty = min(max(tx, 0), W - 1), min(max(ty, 0), H - 1)
            cell = cell_of(tx, ty, W, H)
            board = None
            for dt in range(0, 151):
                for f in (c['中心帧'] - dt, c['中心帧'] + dt):
                    if a0 <= f < a0 + n and pose[f]['遮挡'][cell - 1] <= 0.05 and not pose[f]['切镜头']:
                        board = f; break
                if board is not None:
                    break
            for k, f in enumerate(six):
                cv2.imwrite(str(d / 'A' / f'{k + 1}-整帧-f{f:07d}.jpg'), cv2.imread(str(seg / '帧' / f'f{f:07d}.jpg')), [cv2.IMWRITE_JPEG_QUALITY, 95])
            for k, pf in enumerate(c['停顿帧']):
                cv2.imwrite(str(d / 'B' / f"{k + 1}-停顿帧-f{pf['帧']:07d}.jpg"), cv2.imread(str(seg / '帧' / f"f{pf['帧']:07d}.jpg")), [cv2.IMWRITE_JPEG_QUALITY, 95])
                src = seg / '裁片' / pf['裁片']
                (d / 'B' / f"{k + 1}-手部裁片-f{pf['帧']:07d}.jpg").write_bytes(src.read_bytes())
            if board is not None:
                bimg = cv2.imread(str(seg / '帧' / f'f{board:07d}.jpg'))
                cv2.imwrite(str(d / 'A' / f'7-板面整帧-f{board:07d}.jpg'), bimg, [cv2.IMWRITE_JPEG_QUALITY, 95])
                x0 = int(min(max(tx - CROP / 2, 0), W - CROP)); y0 = int(min(max(ty - CROP / 2, 0), H - CROP))
                cv2.imwrite(str(d / 'B' / f'9-板面裁片-f{board:07d}.jpg'), bimg[y0:y0 + CROP, x0:x0 + CROP], [cv2.IMWRITE_JPEG_QUALITY, 95])
            item = {'题号': qid, '片段': p['片段'], '层': p['层'], '词': c['词'], '上下文': c['上下文'], '说出帧': c['中心帧'],
                    '程序线索_指尖格': cell, '停顿帧': [x['帧'] for x in c['停顿帧']], 'A整帧': six,
                    '板面帧': board, '备注': '' if board is not None else '前后 5 秒找不到指尖所在格未被遮挡的帧'}
            (d / '题.json').write_text(json.dumps(item, ensure_ascii=False, indent=1) + '\n')
            items.append(item)
    (out / '题目清单.json').write_text(json.dumps(items, ensure_ascii=False, indent=1) + '\n')
    print('题数', len(items), '有板面图', sum(i['板面帧'] is not None for i in items))


if __name__ == '__main__':
    main()

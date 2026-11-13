"""苹果识别 × Claude 叠图定稿 逐字比对，并复核去重。用法：python3 vision_compare.py

口径（看结果前定）：
- 两边都先繁转简（opencc t2s），只比汉字和数字，去掉标点、空格、~。苹果识别只取可信度 ≥ 0.3 的行。
- 比的是「字的多重集」，不比顺序（苹果把竖排星名横着读成一行，顺序本来就对不上）。
- 一张定稿判「有出入」：定稿有而苹果没有的字（定稿独有）或苹果有而定稿没有的字（苹果独有）≥ max(3, 定稿字数的 8%)。
  两边都会错：苹果常把「奏」读成「秦」、漏小字；所以「有出入」只是待看原图的名单，不直接改定稿。
- 去重复核：重复状态的代表帧 vs 首次出现那张的代表帧，苹果读出的字对称差 ≥ 3 → 判「不是真重复」，要拆出来补转写；
  状态内部：起 / 止帧 vs 代表帧，对称差 ≥ 3 → 判「状态中途字变了」。
输出：叠图转写/苹果核对/ 下 定稿比对.jsonl、去重复核.jsonl、汇总.md
"""
import json
import re
from collections import Counter
from pathlib import Path

import opencc

ROOT = Path(__file__).resolve().parent
D = ROOT / '叠图转写'
OUT = D / '苹果核对'
OUT.mkdir(exist_ok=True)
cc = opencc.OpenCC('t2s')
KEEP = re.compile(r'[一-鿿0-9□]')


def chars(s):
    return Counter(c for c in cc.convert(s) if KEEP.match(c) and c != '□')


def vtext(rec, th=0.3):
    rows = rec['行'] if '块' not in rec else [x for b in rec['块'] for x in b['行']]
    return ''.join(x['字'] for x in rows if x['可信'] >= th)


def main():
    vis = {}
    for f in (D / '苹果识别2').glob('P*.jsonl'):  # 第二版：整帧识别、只留叠图范围
        for l in f.open():
            r = json.loads(l)
            vis[(r['编号'], r['帧'])] = r
    final = {json.loads(l)['编号']: json.loads(l) for l in (D / '叠图定稿.jsonl').open()}
    sts = {}
    for f in (ROOT / '叠图状态').glob('P*.json'):
        if f.name.startswith('复查'):
            continue
        for s in json.loads(f.read_text()):
            sts[s['编号']] = s

    # ① 定稿 vs 苹果（只比新状态，重复状态引用同一份定稿）
    rows, flag = [], 0
    tot_d = tot_common = 0
    for k, r in final.items():
        if r.get('重复于') or (k, '代表') not in vis:
            continue
        dtxt = ''.join(kk.rstrip('′') + ''.join(v) for kk, v in (r.get('格') or {}).items()) + ''.join(r.get('格外文字') or [])
        dc, vc = chars(dtxt), chars(vtext(vis[(k, '代表')]))
        only_d, only_v = dc - vc, vc - dc
        # 第二版口径：苹果读不全，「定稿独有」不当问题；只看苹果把握最大（可信度 1.0）却不在定稿里的字
        vhi = chars(vtext(vis[(k, '代表')], 0.99))
        only_v_hi = vhi - dc
        bad = sum(only_v_hi.values()) >= 2
        flag += bad
        tot_d += sum(dc.values()); tot_common += sum((dc & vc).values())
        rows.append({'编号': k, '依据': r['依据'], '定稿字数': sum(dc.values()), '苹果字数': sum(vc.values()),
                     '共有': sum((dc & vc).values()), '定稿独有': ''.join(sorted(only_d.elements())), '苹果独有': ''.join(sorted(only_v.elements())), '苹果高信独有': ''.join(sorted(only_v_hi.elements())), '有出入': bad})
    with (OUT / '定稿比对.jsonl').open('w') as fh:
        for x in rows:
            fh.write(json.dumps(x, ensure_ascii=False) + '\n')

    # ② 去重复核
    dd, n_rep, n_rep_bad, n_in, n_in_bad = [], 0, 0, 0, 0
    for k, s in sts.items():
        a = vis.get((k, '代表'))
        if a is None:
            continue
        if s['重复于'] and (s['重复于'], '代表') in vis:
            n_rep += 1
            x, y = chars(vtext(a, 0.99)), chars(vtext(vis[(s['重复于'], '代表')], 0.99))
            diff = sum(((x - y) + (y - x)).values())
            if diff >= 3:
                n_rep_bad += 1
                dd.append({'编号': k, '类': '不是真重复', '对比': s['重复于'], '字差': diff, '本张独有': ''.join((x - y).elements()), '对方独有': ''.join((y - x).elements())})
        for kind in ('起', '止'):
            b = vis.get((k, kind))
            if b is None:
                continue
            n_in += 1
            x, y = chars(vtext(b, 0.99)), chars(vtext(a, 0.99))
            diff = sum(((x - y) + (y - x)).values())
            if diff >= 3:
                n_in_bad += 1
                dd.append({'编号': k, '类': f'状态中途字变了（{kind}帧）', '字差': diff, '该帧独有': ''.join((x - y).elements()), '代表帧独有': ''.join((y - x).elements())})
    with (OUT / '去重复核.jsonl').open('w') as fh:
        for x in dd:
            fh.write(json.dumps(x, ensure_ascii=False) + '\n')

    s = (f'# 苹果识别核对汇总\n\n'
         f'- 定稿比对：{len(rows)} 张新状态，定稿字 {tot_d} 个里苹果也读出 {tot_common} 个（{tot_common / max(tot_d, 1):.1%}）；'
         f'苹果有把握读出、定稿里却没有的字 ≥2 个（待看原图）{flag} 张。\n'
         f'- 去重复核：重复状态 {n_rep} 个，苹果读出的字和首次那张不一样（字差 ≥ 3）的 {n_rep_bad} 个；'
         f'状态内起止帧 {n_in} 张，中途字变了的 {n_in_bad} 张。\n')
    (OUT / '汇总.md').write_text(s)
    print(s)


if __name__ == '__main__':
    main()

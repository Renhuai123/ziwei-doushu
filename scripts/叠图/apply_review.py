"""把三批复核结果合进叠图定稿，生成第二版。用法：python3 apply_review.py
输入：叠图转写/叠图定稿.jsonl（第一版）、叠图转写/复核批/结果-A*.json / 结果-B*.json / 结果-C*.json
输出：叠图转写/叠图定稿-v2.jsonl + 终端汇总

- A（苹果标出可能漏录）：结论「定稿有漏错」→ 用复核给出的完整内容替换，依据加「＋复核修正」。
- B（疑似误判为重复）：结论「有不同」→ 这个状态拆成独立状态（重复于 = 空），内容用复核给出的，依据「去重拆分（对照首次修正）」。
- C（整张大盘逐格核对）：结论「定稿有漏错」→ 用逐格核对的完整内容替换，依据加「＋大盘逐格复核」；「完整无误」照旧、依据加「＋大盘逐格复核无误」。
- 其余重复状态引用首次那张的（修正后）内容。
内容单元按 compare_overlay.py 的同一口径归一化（去标点、去描述性文字）。
"""
import glob
import json
from pathlib import Path

import compare_overlay as C

ROOT = Path(__file__).resolve().parent
D = ROOT / '叠图转写'
R = D / '复核批'


def norm_content(cells, lines):
    out = {}
    for k, v in (cells or {}).items():
        key = C.norm(k)
        while key in out:
            key += '′'
        out[key] = [t for t in (C.tok(x) for x in v or []) if t]
    return out, sorted(t for t in (C.tok(x) for x in lines or []) if t)


def load(prefix):
    rs = {}
    for f in sorted(glob.glob(str(R / f'结果-{prefix}*.json'))):
        for r in json.load(open(f)):
            rs[r['编号']] = r
    return rs


def main():
    v1 = [json.loads(l) for l in (D / '叠图定稿.jsonl').open()]
    A, B, Cc = load('A'), load('B'), load('C')
    stat = {'A 修正': 0, 'A 无误': 0, 'B 拆分': 0, 'B 维持重复': 0, 'C 修正': 0, 'C 无误': 0}
    base = {}
    for r in v1:
        if r.get('重复于'):
            continue
        k = r['编号']
        rec = dict(r)
        if k in Cc:
            c = Cc[k]
            if c.get('结论') == '定稿有漏错' and c.get('格'):
                rec['格'], rec['格外文字'] = norm_content(c.get('格'), c.get('格外文字'))
                rec['依据'] = r['依据'] + '＋大盘逐格复核修正'
                rec['复核改动'] = c.get('改动') or []
                stat['C 修正'] += 1
            else:
                rec['依据'] = r['依据'] + '＋大盘逐格复核无误'
                stat['C 无误'] += 1
        if k in A:
            a = A[k]
            if a.get('结论') == '定稿有漏错' and (a.get('格') or a.get('格外文字')):
                rec['格'], rec['格外文字'] = norm_content(a.get('格'), a.get('格外文字'))
                rec['依据'] = rec['依据'] + '＋复核修正（苹果标出）'
                rec['复核改动'] = (rec.get('复核改动') or []) + (a.get('改动') or [])
                stat['A 修正'] += 1
            else:
                stat['A 无误'] += 1
        base[k] = rec
    out = []
    for r in v1:
        k = r['编号']
        if not r.get('重复于'):
            out.append(base[k])
            continue
        b = B.get(k)
        if b and b.get('结论') == '有不同' and (b.get('格') or b.get('格外文字')):
            rec = {kk: r[kk] for kk in ('编号', '集', '起秒', '止秒', '代表帧号')}
            rec['重复于'] = None
            rec['格'], rec['格外文字'] = norm_content(b.get('格'), b.get('格外文字'))
            rec['依据'] = '去重拆分（对照首次修正）'
            rec['复核改动'] = b.get('不同处') or []
            stat['B 拆分'] += 1
        else:
            first = base.get(r['重复于'])
            rec = {kk: r[kk] for kk in ('编号', '集', '起秒', '止秒', '代表帧号', '重复于')}
            if first:
                rec.update({kk: first[kk] for kk in ('格', '格外文字') if kk in first})
                rec['依据'] = first['依据'] + f'（重复于 {r["重复于"]}）'
            if b:
                stat['B 维持重复'] += 1
        out.append(rec)
    with (D / '叠图定稿-v2.jsonl').open('w') as fh:
        for r in out:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    print(f'第二版定稿 {len(out)} 个状态；新状态 {sum(1 for r in out if not r.get("重复于"))}')
    print(stat)


if __name__ == '__main__':
    main()

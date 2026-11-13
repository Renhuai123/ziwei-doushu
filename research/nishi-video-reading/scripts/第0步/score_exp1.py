"""实验 1 打分：探针发现率（探针那一张标了异常）与无探针窗误报率（窗内任一张标了异常）。用法：python score_exp1.py <输出名>"""
import json, sys
from pathlib import Path
root = Path(__file__).resolve().parent / '小考' / '实验1'
ans = {a['窗口']: a for a in json.loads((root / '答案.json').read_text())}
out = [json.loads(l) for l in (root / '输出' / f'{sys.argv[1]}.jsonl').open()]
res = {'换帧': [0, 0], '遮挡': [0, 0]}; fa = [0, 0]; fnum = [0, 0]; detail = []
for o in out:
    a = ans[o['窗口']]; rows = o['行'] or []
    flagged = [i + 1 for i, r in enumerate(rows) if r.get('异常') is True]
    exp_f = list(range(a['起'], a['起'] + 12))
    fnum[0] += sum(1 for i, r in enumerate(rows) if r.get('f') == exp_f[i]); fnum[1] += 12
    if a['探针']:
        hit = a['位置'] in flagged
        res[a['探针']][0] += hit; res[a['探针']][1] += 1
        detail.append((o['窗口'], a['探针'], a['位置'], flagged, '发现' if hit else '漏掉'))
    else:
        fa[0] += bool(flagged); fa[1] += 1
        if flagged: detail.append((o['窗口'], '无探针', None, flagged, '误报'))
tot = [res['换帧'][0] + res['遮挡'][0], res['换帧'][1] + res['遮挡'][1]]
print(f"探针发现率 {tot[0]}/{tot[1]}（换帧 {res['换帧'][0]}/{res['换帧'][1]}，遮挡 {res['遮挡'][0]}/{res['遮挡'][1]}）")
print(f"无探针窗误报率 {fa[0]}/{fa[1]} = {fa[0] / fa[1]:.1%}")
print(f"帧号照抄正确 {fnum[0]}/{fnum[1]}")
for d in detail: print(d)

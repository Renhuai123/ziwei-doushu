"""实验 1 加测打分：探针那一张标了「异常」算发现。用法：python score_probe.py <输出名> <12|6>"""
import json, sys
from pathlib import Path
root = Path(__file__).resolve().parent / '小考' / '实验1b'
n = int(sys.argv[2])
ans = {a['窗口']: a for a in json.loads((root / '答案.json').read_text())}
res = {}; extra = 0; fmt = 0
for o in map(json.loads, (root / '输出' / f'{sys.argv[1]}.jsonl').open()):
    a = ans[o['窗口']]; pos = a['位置'] if n == 12 else a['六帧位置']
    rows = o['行'] or []; fmt += o['格式失败']
    flagged = [i + 1 for i, r in enumerate(rows) if r.get('异常') is True]
    r = res.setdefault(a['探针'], [0, 0]); r[0] += pos in flagged; r[1] += 1
    extra += len([x for x in flagged if x != pos])
for k, (h, t) in res.items(): print(f'{k} 发现 {h}/{t} = {h / t:.0%}')
h = sum(v[0] for v in res.values()); t = sum(v[1] for v in res.values())
print(f'合计 {h}/{t} = {h / t:.0%}；探针窗里错标别的帧 {extra} 处；格式失败 {fmt}')

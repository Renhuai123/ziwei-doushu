"""实验 3 打分（板书转写）。用法：python score_exp3.py

标准答案里 64% 的字位连 Claude 都认不出，所以主看「不硬猜」：
- 认对：模型写出的字里，属于标准答案「认得出的字」的个数 / 标准答案认得出的字数（召回）。
- 编造：模型写出的具体字里，不在标准答案任何认得出的字里的比例（越低越好）。
- 探针：6 道擦字题，被擦掉的字（原裁片转写有、裁片转写没有）有没有出现在模型答案里（补回 = 照常识补字）。
"""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent / '小考' / '实验3'
SKIP = set('□ 、，。．·.,-—()（）')


def cs(lines):
    return Counter(c for c in ''.join(lines or []) if c not in SKIP and c.strip())


gt = {}
for f in (ROOT / '标准答案').glob('*.json'):
    for a in json.loads(f.read_text()):
        gt[a['题号']] = a
probes = {}
for k, a in gt.items():
    if a.get('原裁片转写'):
        erased = cs(a['原裁片转写']) - cs(a['转写'])
        if erased:
            probes[k] = erased
print(f'标准答案 {len(gt)} 题；认得出的字共 {sum(sum(cs(a["转写"]).values()) for a in gt.values())} 个；有效擦字探针 {len(probes)} 道（被擦掉且原图认得出的字：{dict((k, "".join(v)) for k, v in probes.items())}）')
for f in sorted((ROOT / '输出').glob('*.jsonl')):
    rs = {r['题号']: (r['答'] or {}) for r in map(json.loads, f.open())}
    fail = sum(1 for r in rs.values() if not r)
    hit = tot = made = out = 0
    restored = 0
    for k, a in gt.items():
        g = cs(a['转写']); m = cs(rs.get(k, {}).get('转写'))
        hit += sum((g & m).values()); tot += sum(g.values())
        allg = g | cs(a.get('原裁片转写'))
        made += sum((m - allg).values()); out += sum(m.values())
        if k in probes and sum((probes[k] & m).values()):
            restored += 1
    print(f'{f.stem:18s} 交白卷 {fail:2d}/30  认对 {hit}/{tot}={hit / tot:.0%}  编造 {made}/{out}={made / max(out, 1):.0%}  擦字被补回 {restored}/{len(probes)}')

"""实验 2 / 2b 打分。用法：python score_exp2.py <实验2|实验2b> <输出名>

计分字段（Fable 实验 2）：触板（是/否/未知 三类完全一致）、在写（动作是否为「写」）、遮挡区域（格号集合完全相同）、
触板区域（只在标准答案触板=是且区域把握确定时计）。标准答案里标「不确定」的字段不计分，计入剔除。
另报：动作五类完全一致率（参考，不是门槛）。
"""
import json, sys
from pathlib import Path
root = Path(__file__).resolve().parent / '小考' / sys.argv[1]
gt = {}
for f in (root / '标准答案').glob('*.json'):
    for k, rows in json.loads(f.read_text()).items():
        if k != '备注':
            gt[k] = rows
out = {json.loads(l)['窗口']: json.loads(l) for l in (root / '输出' / f'{sys.argv[2]}.jsonl').open()}
stat = {k: [0, 0, 0] for k in ['触板', '在写', '遮挡区域', '触板区域', '动作(参考)']}   # 对, 计分数, 剔除数
missing = 0
for w, rows in gt.items():
    o = out.get(w)
    pred = (o or {}).get('行') or []
    for i, g in enumerate(rows):
        p = pred[i] if i < len(pred) else None
        if p is None:
            missing += 1
        conf = g.get('把握', {})
        def add(name, ok, sure):
            if not sure:
                stat[name][2] += 1; return
            stat[name][1] += 1; stat[name][0] += bool(ok)
        add('触板', p and p.get('触板') == g['触板'], conf.get('触板') == '确定')
        add('在写', p and (p.get('动作') == '写') == (g['动作'] == '写'), conf.get('动作') == '确定')
        add('遮挡区域', p and sorted(p.get('遮挡区域') or []) == sorted(g['遮挡区域'] or []), conf.get('遮挡区域') == '确定')
        add('动作(参考)', p and p.get('动作') == g['动作'], conf.get('动作') == '确定')
        if g['触板'] == '是':
            add('触板区域', p and p.get('触板区域') == g['触板区域'], conf.get('触板区域') == '确定')
print(f'{sys.argv[1]} / {sys.argv[2]}：标准答案 {len(gt)} 窗 {sum(len(r) for r in gt.values())} 帧；模型缺行 {missing}')
for k, (ok, n, ex) in stat.items():
    print(f'  {k}：{ok}/{n} = {ok / n:.1%}（剔除 {ex}）' if n else f'  {k}：无可计分（剔除 {ex}）')

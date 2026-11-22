"""从帮手的记录文件取最后一条回复（JSON），存进 小考/实验2（或 2b）/标准答案/<片段>.json。用法：python save_agent.py <记录文件>"""
import json, re, sys
from pathlib import Path
lines = open(sys.argv[1]).read().splitlines()
text = None
for line in reversed(lines):
    d = json.loads(line)
    if d.get('type') == 'assistant':
        parts = [c.get('text', '') for c in d['message']['content'] if c.get('type') == 'text']
        if any(p.strip() for p in parts):
            text = ''.join(parts); break
m = re.search(r'\{.*\}', text, re.S)
data = json.loads(m.group(0))
keys = [k for k in data if k != '备注']
seg = keys[0].rsplit('-', 1)[0]
exp = '实验2b' if keys[0].rsplit('-', 1)[1].startswith('A') else '实验2'
assert all(len(data[k]) == 12 for k in keys) and len(keys) == (2 if exp == '实验2b' else 3), (seg, [len(data[k]) for k in keys])
out = Path(__file__).resolve().parent / '小考' / exp / '标准答案' / f'{seg}.json'
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
print('已存', out.name, '备注：', data.get('备注', '')[:80])

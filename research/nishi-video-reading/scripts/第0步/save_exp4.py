"""存实验 4 帮手的标准答案（JSON 数组）到 小考/实验4/标准答案/<首题号>-<末题号>.json。用法：python save_exp4.py <记录文件>"""
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
arr = json.loads(re.search(r'\[.*\]', text, re.S).group(0))
ids = [a['题号'] for a in arr]
out = Path(__file__).resolve().parent / '小考' / '实验4' / '标准答案' / f'{ids[0]}-{ids[-1]}.json'
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(arr, ensure_ascii=False, indent=1) + '\n')
from collections import Counter
print('已存', out.name, len(arr), '题', dict(Counter((a['是指代'], a['把握']) for a in arr)))

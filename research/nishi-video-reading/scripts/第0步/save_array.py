"""存帮手的标准答案（JSON 数组）到 小考/<实验>/标准答案/<首题号>-<末题号>.json。用法：python save_array.py <记录文件> <实验3|实验4>"""
import json, re, sys
from collections import Counter
from pathlib import Path
text = None
for line in reversed(open(sys.argv[1]).read().splitlines()):
    d = json.loads(line)
    if d.get('type') == 'assistant':
        parts = [c.get('text', '') for c in d['message']['content'] if c.get('type') == 'text']
        if any(p.strip() for p in parts):
            text = ''.join(parts); break
arr = json.loads(re.search(r'\[.*\]', text, re.S).group(0))
ids = [a['题号'] for a in arr]
out = Path(__file__).resolve().parent / '小考' / sys.argv[2] / '标准答案' / f'{ids[0]}-{ids[-1]}.json'
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(arr, ensure_ascii=False, indent=1) + '\n')
print('已存', sys.argv[2], out.name, len(arr), '题', dict(Counter(a['把握'] for a in arr)))

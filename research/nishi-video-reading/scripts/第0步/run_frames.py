"""逐帧层调用 DeepSeek（实验 1、2 用）。

用法：python run_frames.py <实验目录> <输出名> [窗口子目录，默认「窗口」] [--thinking] [--context] [--v2]
- 实验目录下的 窗口/<窗口ID>/01–12.jpg 每窗一次请求；提示词 = 逐帧提示词-v1.md。
- --context：同一片段按窗口顺序滚动，带上前 2 窗模型自己的输出当「上文」（实验 2 用）。
- 输出到 <实验目录>/输出/<输出名>.jsonl：每窗一行，含原始回答、解析后的 12 行、usage、耗时。
- 不合格式（行数不是 12 或 JSON 解析失败）自动重发一次，仍失败记「格式失败」。
"""
import base64
import json
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent
KEY = Path('~/.config/nishi-study/deepseek.key').expanduser().read_text().strip()
PROMPT = (ROOT / ('逐帧提示词-v2.md' if '--v2' in sys.argv else '逐帧提示词-v1.md')).read_text()


def call(content, thinking):
    body = {'model': 'deepseek-flash', 'messages': [{'role': 'user', 'content': content}],
            'thinking': {'type': 'enabled' if thinking else 'disabled'}, 'max_tokens': 16000 if thinking else 1200}
    req = urllib.request.Request('https://api.deepseek.com/chat/completions', json.dumps(body).encode(),
                                 {'Content-Type': 'application/json', 'Authorization': f'Bearer {KEY}'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except Exception as e:  # 网络或限流：退避重试
            if attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))


def parse(text, n=12):
    rows = []
    for line in text.strip().splitlines():
        line = line.strip().strip(',')
        if line.startswith('{'):
            rows.append(json.loads(line))
    if len(rows) != n:
        raise ValueError(f'行数 {len(rows)}')
    return rows


def prompt_for(n):
    """冻结提示词按张数改写（只改张数，规则不变）。"""
    if n == 12:
        return PROMPT
    return PROMPT.replace('下面是 12 张', f'下面是 {n} 张').replace('#01–#12', f'#01–#{n:02d}').replace('共 12 行', f'共 {n} 行')


def run_window(wdir, thinking, context_text):
    n = len(list(wdir.glob('*.jpg')))
    content = [{'type': 'text', 'text': prompt_for(n) + ('\n上文（前面窗口你自己的记录）：\n' + context_text if context_text else '')}]
    for k in range(1, n + 1):
        b64 = base64.b64encode((wdir / f'{k:02d}.jpg').read_bytes()).decode()
        content.append({'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}})
    t = time.time()
    out = {'窗口': wdir.name}
    for attempt in range(2):
        d = call(content, thinking)
        text = d['choices'][0]['message']['content'] or ''
        try:
            out.update({'行': parse(text, n), '格式失败': False})
            break
        except Exception as e:
            out.update({'行': None, '格式失败': True, '解析错误': str(e)})
    out.update({'原始回答': text, 'usage': d['usage'], '秒': round(time.time() - t, 1), '重发': attempt})
    return out


def main():
    exp, name = ROOT / sys.argv[1], sys.argv[2]
    windir = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else '窗口'
    thinking, context = '--thinking' in sys.argv, '--context' in sys.argv
    outp = exp / '输出' / f'{name}.jsonl'
    outp.parent.mkdir(exist_ok=True)
    if outp.exists():
        raise SystemExit('已有输出，不覆盖')
    wins = sorted((exp / windir).iterdir())
    results = []
    if context:
        groups = {}
        for w in wins:
            groups.setdefault(w.name.rsplit('-', 1)[0], []).append(w)

        def run_group(ws):
            hist, res = [], []
            for w in ws:
                ctx = '\n'.join(json.dumps(r, ensure_ascii=False) for h in hist[-2:] for r in (h or []))
                r = run_window(w, thinking, ctx)
                res.append(r); hist.append(r['行'])
            return res
        with ThreadPoolExecutor(8) as ex:
            for res in ex.map(run_group, groups.values()):
                results += res
    else:
        with ThreadPoolExecutor(8) as ex:
            results = list(ex.map(lambda w: run_window(w, thinking, ''), wins))
    with outp.open('w') as fh:
        for r in results:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    pt = sum(r['usage']['prompt_tokens'] for r in results); ct = sum(r['usage']['completion_tokens'] for r in results)
    print(f'{len(results)} 窗；格式失败 {sum(r["格式失败"] for r in results)}；输入 {pt}，输出 {ct} token；'
          f'每窗平均输入 {pt / len(results):.0f}、输出 {ct / len(results):.0f}')


if __name__ == '__main__':
    main()

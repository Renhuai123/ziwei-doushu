"""叠图两遍转写对不上的格，交 Claude Opus 5.5 xhigh 第三次看原图裁定。用法：
  uv run --with anthropic python claude_adjudicate.py <key 文件> <并发>
输入：叠图转写/两遍比对.jsonl 里「一致=false」的张；输出：叠图转写/裁定.jsonl（可断点续跑）。

两种读法匿名成「甲 / 乙」，按编号哈希决定谁是第一遍（不按固定顺序，避免位置偏好）。
裁定者只看原图：可以选甲、选乙，也可以都不对并给出自己的读法；看不清写 □，不许按紫微知识补字。
"""
import base64
import hashlib
import json
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import anthropic

ROOT = Path(__file__).resolve().parent
D = ROOT / '叠图转写'
client = anthropic.Anthropic(api_key=Path(sys.argv[1]).read_text().strip(), max_retries=6)
CONC = int(sys.argv[2])
OUT = D / '裁定.jsonl'
LOCK = threading.Lock()

HEAD = """这是倪海厦讲紫微斗数的课堂录像中的一帧，画面上贴有电子叠图（白底印刷字的命盘宫位格等）。
两位转写员各自独立转写了叠图里的印刷字，下面这些地方两人写得不一样。请只看原图，逐处判断叠图上实际印的是什么。

规则：
1. 只依据原图上实际印的字。看不清的字写 □。不要根据紫微斗数知识、排盘规则或常识补字。
2. 只要印刷字本身：不要写颜色、方框、箭头、「标签」之类的描述。繁体照抄繁体，简体照抄简体。
3. 甲乙都不对时，写出你看到的。

有分歧的地方：
"""
TAIL = """
只输出一个 JSON，不要其他文字：
{"裁定": [{"处": "上面列的「格」或「格外文字」原样照抄", "采用": "甲/乙/都不对", "印刷字": ["这一格实际印的全部内容单元，如 太阳旺权、流年 8,20,32"], "看不清": ["说明哪里看不清"]}]}"""


def build(rec):
    flip = int(hashlib.md5(rec['编号'].encode()).hexdigest(), 16) % 2 == 1
    lines = []
    for d in rec['差异']:
        if '文字行' in d:
            a, b = d['文字行']['第一遍独有'], d['文字行']['第二遍独有']
            where = '格外文字'
        elif '只在' in d:
            a, b = (['（这一格整格都有）'], ['（没有这一格）']) if d['只在'] == '第一遍' else (['（没有这一格）'], ['（这一格整格都有）'])
            where = d['格']
        else:
            a, b = d['第一遍独有'], d['第二遍独有']
            where = d['格']
        x, y = (b, a) if flip else (a, b)
        lines.append(f'- 格：{where}\n  甲写了（乙没有）：{"、".join(x) or "（无）"}\n  乙写了（甲没有）：{"、".join(y) or "（无）"}')
    return HEAD + '\n'.join(lines) + TAIL, flip


def run(rec):
    prompt, flip = build(rec)
    img = ROOT / '叠图状态' / '帧' / f'{rec["编号"]}.jpg'
    b64 = base64.standard_b64encode(img.read_bytes()).decode()
    t = time.time()
    with client.messages.stream(model='claude-opus-5-5', max_tokens=32000, output_config={'effort': 'xhigh'},
                                messages=[{'role': 'user', 'content': [
                                    {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': b64}},
                                    {'type': 'text', 'text': prompt}]}]) as s:
        msg = s.get_final_message()
    text = ''.join(b.text for b in msg.content if b.type == 'text')
    m = re.search(r'\{.*\}', text, re.S)
    try:
        parsed = json.loads(m.group(0)) if m else None
    except Exception:
        parsed = None
    u = msg.usage
    out = {'编号': rec['编号'], '甲是第一遍': not flip, '答': parsed, '原始回答': text, '提示词': prompt,
           '美元': round(u.input_tokens * 4e-6 + u.output_tokens * 20e-6, 4), '秒': round(time.time() - t, 1)}
    with LOCK:
        with OUT.open('a') as fh:
            fh.write(json.dumps(out, ensure_ascii=False) + '\n')
    print(rec['编号'], f"${out['美元']}", '解析失败' if parsed is None else '', flush=True)
    return out


def safe(rec):
    for attempt in range(3):
        try:
            return run(rec)
        except Exception as e:
            print(rec['编号'], '第', attempt + 1, '次出错', type(e).__name__, str(e)[:200], flush=True)
            time.sleep(10 * (attempt + 1))
    return None


def main():
    todo = [r for r in map(json.loads, (D / '两遍比对.jsonl').open()) if not r['一致']]
    done = {json.loads(l)['编号'] for l in OUT.open()} if OUT.exists() else set()
    todo = [r for r in todo if r['编号'] not in done]
    print(f'待裁定 {len(todo)} 张（已裁 {len(done)}），并发 {CONC}', flush=True)
    with ThreadPoolExecutor(CONC) as ex:
        res = [r for r in ex.map(safe, todo) if r]
    print(f'本轮裁定 {len(res)}，花费约 ${sum(r["美元"] for r in res):.2f}', flush=True)


if __name__ == '__main__':
    main()

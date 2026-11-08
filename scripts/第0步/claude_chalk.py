"""实验 3 补测：Claude Opus 5.5 xhigh 转写粉笔板书裁片（与 DeepSeek / Kimi 同一提示词、同一批图）。
用法：uv run --with anthropic python claude_chalk.py <key 文件> <轮次标记>
输出：小考/实验3/输出/claude-xhigh-裁片<标记>.jsonl。跑两轮看自洽：两轮写出的字不一样 = 在猜。
注意：标准答案也是 Claude（Opus 5.5 high）看图出的，这里的「认对」只说明与之一致，多认出的字无法独立核实；
擦字探针（被擦掉的字被写回来）才是硬证据。
"""
import base64
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import anthropic

ROOT = Path(__file__).resolve().parent
EXP = ROOT / '小考' / '实验3'
client = anthropic.Anthropic(api_key=Path(sys.argv[1]).read_text().strip(), max_retries=6)
TAG = sys.argv[2]
RULE = ('转写看得见的全部粉笔字：从上到下、每行从左到右；认不出的字写 □；数字、符号照抄；'
        '不转写台标水印「@程心学」和线框圆圈。不要根据紫微、易经知识或常识补字，板上只写了半个词就只写那半个。\n'
        '只输出一个 JSON，不要其他文字：{"转写": ["第一行", "第二行"], "看不清字数": 整数}')
PROMPT = '这是讲课视频里黑板的一块裁图。请转写图中黑板上的粉笔字。\n' + RULE
OUT = EXP / '输出' / f'claude-xhigh-裁片{TAG}.jsonl'
LOCK = __import__('threading').Lock()


def run(q):
    t = time.time()
    b64 = base64.standard_b64encode((EXP / '题' / q['题号'] / '裁片.jpg').read_bytes()).decode()
    with client.messages.stream(model='claude-opus-5-5', max_tokens=32000, output_config={'effort': 'xhigh'},
                                messages=[{'role': 'user', 'content': [
                                    {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': b64}},
                                    {'type': 'text', 'text': PROMPT}]}]) as s:
        msg = s.get_final_message()
    text = ''.join(b.text for b in msg.content if b.type == 'text')
    m = re.search(r'\{.*\}', text, re.S)
    try:
        parsed = json.loads(m.group(0)) if m else None
    except Exception:
        parsed = None
    u = msg.usage
    return {'题号': q['题号'], '答': parsed, '原始回答': text, 'usage': {'prompt_tokens': u.input_tokens, 'completion_tokens': u.output_tokens},
            '美元': round(u.input_tokens * 4e-6 + u.output_tokens * 20e-6, 4), '秒': round(time.time() - t, 1)}


def safe(q):
    # 11-08 第一次两轮都因流式连接被对端断开整轮崩掉、结果没落盘：改成每题重试 3 次、做完一题写一行
    for attempt in range(3):
        try:
            r = run(q)
            with LOCK:
                with OUT.open('a') as fh:
                    fh.write(json.dumps(r, ensure_ascii=False) + '\n')
            return r
        except Exception as e:
            print(q['题号'], '第', attempt + 1, '次出错', type(e).__name__, str(e)[:200], flush=True)
            time.sleep(5)
    return None


def main():
    qs = json.loads((EXP / '题目清单.json').read_text())
    done = {json.loads(l)['题号'] for l in OUT.open()} if OUT.exists() else set()
    with ThreadPoolExecutor(10) as ex:
        list(ex.map(safe, [q for q in qs if q['题号'] not in done]))
    res = [json.loads(l) for l in OUT.open()]
    print(f'{OUT.stem}：{len(res)}/30 题，解析失败 {sum(r["答"] is None for r in res)}，花费 ${sum(r["美元"] for r in res):.2f}')


if __name__ == '__main__':
    main()

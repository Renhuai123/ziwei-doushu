"""Claude Opus 5.5（xhigh）转写电子叠图里的印刷字。用法：
  uv run --with anthropic python claude_overlay.py <key 文件> <输出 jsonl> <并发> <图片…>

每张图一行：编号、解析后的 JSON、原始回答、usage、限速头、耗时。已写过的编号跳过（可断点续跑）。
只转写叠图（白底印刷字），不转写粉笔字、字幕、水印；看不清写 □，禁止按紫微知识补字。
"""
import base64
import json
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import anthropic

KEY = Path(sys.argv[1]).read_text().strip()
OUT = Path(sys.argv[2])
CONC = int(sys.argv[3])
IMGS = [Path(p) for p in sys.argv[4:]]
client = anthropic.Anthropic(api_key=KEY, max_retries=6)
lock = threading.Lock()

PROMPT = """这是倪海厦讲紫微斗数的课堂录像中的一帧。后期剪辑在画面上贴了电子叠图：白底印刷字的命盘、宫位小格、表格或文字框。

任务：只转写电子叠图里的印刷内容。黑板上的粉笔字、底部字幕、台标水印「@程心学」都不转写。

规则：
1. 照抄看得见的字。看不清的字写 □。不要根据紫微斗数知识、排盘规则或常识补字、改字、调顺序。
2. 命盘按格转写：每格写它在这块叠图里的位置（第几行第几列，从左上数起）、宫名、天干地支、全部星曜（星名后面的庙旺利陷、化禄化权化科化忌等小字照抄）、大限岁数和格里其他字。中间大格写出生资料等全部文字。
3. 不是命盘的叠图（表格、文字框、图片）按从上到下、每行从左到右逐行转写；图片写一句看得见的内容。
4. 一帧里有几块叠图就分几块写。画面里其实没有电子叠图，就让「叠图」为空并在备注里说明。

只输出一个 JSON，不要其他文字：
{"叠图": [{"类型": "命盘/宫位小格/表格/文字框/图片/其他", "位置": "在画面哪里", "格": [{"行": 1, "列": 1, "宫名": "", "干支": "", "星曜": [""], "其他": [""]}], "文字行": [""], "看不清字数": 0}], "备注": ""}
不是命盘的叠图「格」留空数组；命盘的「文字行」只放格外的字。"""
if __import__('os').environ.get('TRAD_RULE'):
    # 第二遍（11-08）：抽检发现叠图印的繁体「將星」被写成简体「将星」，第二遍加这条；两遍对不上的字逐个看原图定
    PROMPT = PROMPT.replace('1. 照抄看得见的字。', '1. 照抄看得见的字，繁体字照抄繁体、简体照抄简体，不要转换。')


def done_ids():
    if not OUT.exists():
        return set()
    return {json.loads(l)['编号'] for l in OUT.open() if l.strip()}


def run(img):
    t = time.time()
    b64 = base64.standard_b64encode(img.read_bytes()).decode()
    with client.messages.stream(
        model='claude-opus-5-5',
        max_tokens=32000,
        output_config={'effort': 'xhigh'},
        messages=[{'role': 'user', 'content': [
            {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': b64}},
            {'type': 'text', 'text': PROMPT}]}],
    ) as stream:
        msg = stream.get_final_message()
        hdr = {k: v for k, v in stream.response.headers.items() if 'ratelimit' in k}
    text = ''.join(b.text for b in msg.content if b.type == 'text')
    m = re.search(r'\{.*\}', text, re.S)
    try:
        parsed = json.loads(m.group(0)) if m else None
    except Exception:
        parsed = None
    u = msg.usage
    rec = {'编号': img.stem, '答': parsed, '原始回答': text, '结束原因': msg.stop_reason,
           'usage': {'input': u.input_tokens, 'output': u.output_tokens}, '美元': round(u.input_tokens * 4e-6 + u.output_tokens * 20e-6, 4),
           '限速': hdr, '秒': round(time.time() - t, 1)}
    with lock:
        with OUT.open('a') as fh:
            fh.write(json.dumps(rec, ensure_ascii=False) + '\n')
    print(img.stem, rec['结束原因'], rec['usage'], f"${rec['美元']}", f"{rec['秒']}s", '解析失败' if parsed is None else '', flush=True)
    return rec


def safe(img):
    # 11-08 全量并发 32 时 129 张因流式连接被断开 / 并发超限丢掉：每张重试 3 次
    for attempt in range(3):
        try:
            return run(img)
        except Exception as e:
            print(img.stem, '第', attempt + 1, '次出错', type(e).__name__, str(e)[:200], flush=True)
            time.sleep(10 * (attempt + 1))
    return None


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    seen = done_ids()
    todo = [p for p in IMGS if p.stem not in seen]
    print(f'共 {len(IMGS)}，已做 {len(IMGS) - len(todo)}，待做 {len(todo)}，并发 {CONC}', flush=True)
    with ThreadPoolExecutor(CONC) as ex:
        res = [r for r in ex.map(safe, todo) if r]
    print(f'本轮完成 {len(res)}，花费约 ${sum(r["美元"] for r in res):.2f}', flush=True)


if __name__ == '__main__':
    main()

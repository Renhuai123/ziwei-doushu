"""实验 3 调用：板书逐格转写。用法：python run_exp3.py <deepseek|kimi> <整帧|裁片|叠加|裁片加字幕>

同一份提示词、同一批图，两家互不知情。DeepSeek 开思考；Kimi reasoning_effort=low。
输出：小考/实验3/输出/<模型>-<输入>.jsonl
"""
import base64
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from apis import CFG
import urllib.request

ROOT = Path(__file__).resolve().parent
EXP = ROOT / '小考' / '实验3'
MODEL, VAR = sys.argv[1], sys.argv[2]
URL, NAME, KEYF, EXTRA = CFG[MODEL]
KEY = Path(KEYF).expanduser().read_text().strip()
RULE = ('转写看得见的全部粉笔字：从上到下、每行从左到右；认不出的字写 □；数字、符号照抄；'
        '不转写台标水印「@程心学」和线框圆圈。不要根据紫微、易经知识或常识补字，板上只写了半个词就只写那半个。\n'
        '只输出一个 JSON，不要其他文字：{"转写": ["第一行", "第二行"], "看不清字数": 整数}')


def prompt(q):
    if VAR == '整帧':
        return f'这是一张讲课画面。把画面（不含底部字幕）横竖各三等分，左上为第 1 格、右下为第 9 格。请只转写第 {q["格"]} 格里黑板上的粉笔字。\n' + RULE
    t = '这是讲课视频里黑板的一块裁图。请转写图中黑板上的粉笔字。\n'
    if VAR == '叠加':
        t = '这是讲课视频里黑板的一块裁图（同一时段多帧叠加，去掉了噪点）。请转写图中黑板上的粉笔字。\n'
    if VAR == '裁片加字幕':
        t += '参考：这段时间讲者说的话（字幕 OCR，可能有错）：' + ' / '.join(q['字幕']) + '\n'
    return t + RULE


def run(q):
    img = {'整帧': '整帧.jpg', '裁片': '裁片.jpg', '叠加': '叠加.jpg', '裁片加字幕': '裁片.jpg'}[VAR]
    b64 = base64.b64encode((EXP / '题' / q['题号'] / img).read_bytes()).decode()
    body = {'model': NAME, 'messages': [{'role': 'user', 'content': [
        {'type': 'text', 'text': prompt(q)}, {'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,' + b64}}]}], **EXTRA}
    req = urllib.request.Request(URL, json.dumps(body).encode(), {'Content-Type': 'application/json', 'Authorization': f'Bearer {KEY}'})
    t = time.time()
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                d = json.load(r)
            break
        except Exception:
            if attempt == 3:
                raise
            time.sleep(10 * (attempt + 1))
    text = d['choices'][0]['message'].get('content') or ''
    m = re.search(r'\{.*\}', text, re.S)
    try:
        parsed = json.loads(m.group(0)) if m else None
    except Exception:
        parsed = None
    return {'题号': q['题号'], '答': parsed, '原始回答': text, 'usage': d.get('usage'), '秒': round(time.time() - t, 1)}


def main():
    out = EXP / '输出' / f'{MODEL}-{VAR}.jsonl'
    out.parent.mkdir(exist_ok=True)
    if out.exists():
        raise SystemExit('已有输出，不覆盖')
    qs = json.loads((EXP / '题目清单.json').read_text())
    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(run, qs))
    with out.open('w') as fh:
        for r in res:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    pt = sum((r['usage'] or {}).get('prompt_tokens', 0) for r in res); ct = sum((r['usage'] or {}).get('completion_tokens', 0) for r in res)
    print(f'{MODEL}-{VAR}：{len(res)} 题，解析失败 {sum(r["答"] is None for r in res)}；输入 {pt}，输出 {ct}')


if __name__ == '__main__':
    main()

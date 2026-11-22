"""实验 4 调用：DeepSeek / Kimi 判断指代。用法：python run_exp4.py <deepseek|kimi> <A|B> <有线索|无线索>

同一份提示词、同一批图，两家互不知情。DeepSeek 开思考；Kimi K3.1 Pro 思考关不掉，用 reasoning_effort=low。
输出：小考/实验4/输出/<模型>-<包>-<线索>.jsonl（每题一行：解析后的 JSON、原始回答、usage、耗时）。
"""
import base64
import json
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from apis import CFG

ROOT = Path(__file__).resolve().parent
EXP = ROOT / '小考' / '实验4'
MODEL, PKG, CLUE = sys.argv[1], sys.argv[2], sys.argv[3]
URL, NAME, KEYF, EXTRA = CFG[MODEL]
KEY = Path(KEYF).expanduser().read_text().strip()
DESC = {
    'A': '图片依次是：说这个词前后各 1 秒内均匀取的 6 张整帧（按时间顺序），最后一张（如有）是讲者手指位置没被身体挡住时的板面整帧。',
    'B': '图片依次是：讲者手部停顿的整帧和对应的手部放大裁片（成对出现，按「整帧、裁片」排列），最后一张（如有）是手指所在位置没被身体挡住时的板面放大裁片。',
}


def prompt(q):
    t = (f'这是一段讲课视频。讲者说了这样一句话（语音转写，可能有错字）：「……{q["上下文"]}……」，其中说到「{q["词"]}」。\n'
         f'{DESC[PKG]}\n\n'
         '请判断：讲者说这个词时，有没有用手、粉笔或教鞭指着画面里的某处；如果有，指的是哪里。\n'
         '只依据画面看得见的内容。被手挡住、看不清的就说看不清，不要根据讲课内容或常识去补字。\n'
         '只输出一个 JSON，不要其他文字：\n'
         '{"是指代": "是/否/看不出", "指向": "黑板/叠图/讲义/自己身上/其他/无", "目标文字": "所指处看得见的字，照抄，看不清留空", '
         '"宫位或盘": "能从画面看出的宫位、大限格或第几张盘，看不出留空", "格": 1到9的整数或null, "依据": "一句话"}\n'
         '其中「格」= 所指位置在第 1 张整帧画面里的格（横竖三等分，左上 1、右上 3、左下 7、右下 9）。')
    if CLUE == '有线索':
        t += f'\n参考：程序检测到的指尖大致位置在第 {q["程序线索_指尖格"]} 格（程序估计，可能有误）。'
    return t


def call(content):
    body = {'model': NAME, 'messages': [{'role': 'user', 'content': content}], **EXTRA}
    req = urllib.request.Request(URL, json.dumps(body).encode(), {'Content-Type': 'application/json', 'Authorization': f'Bearer {KEY}'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise
            time.sleep(10 * (attempt + 1))


def run(q):
    d = EXP / '题' / q['题号'] / PKG
    content = [{'type': 'text', 'text': prompt(q)}]
    for f in sorted(d.glob('*.jpg')):
        content.append({'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,' + base64.b64encode(f.read_bytes()).decode()}})
    t = time.time()
    d_ = call(content)
    text = d_['choices'][0]['message'].get('content') or ''
    m = re.search(r'\{.*\}', text, re.S)
    try:
        parsed = json.loads(m.group(0)) if m else None
    except Exception:
        parsed = None
    return {'题号': q['题号'], '答': parsed, '原始回答': text, 'usage': d_.get('usage'), '图数': len(content) - 1, '秒': round(time.time() - t, 1)}


def main():
    out = EXP / '输出' / f'{MODEL}-{PKG}-{CLUE}.jsonl'
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
    print(f'{MODEL}-{PKG}-{CLUE}：{len(res)} 题，解析失败 {sum(r["答"] is None for r in res)}；输入 {pt}，输出 {ct} token')


if __name__ == '__main__':
    main()

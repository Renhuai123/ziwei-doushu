"""实验 4 重测（v2 / v3 提示词；v3 = 第 2 条改回与标注说明一致：口头用法「而且手没在指」才算否）：只测 B 包、无线索，同一批 90 题（计分仍只用标准答案「确定」的 52 题）。
用法：python run_exp4b.py <模型配置名，如 kimi高>
输出：小考/实验4/输出/<配置名>-B-无线索-v2.jsonl

和 v1 的区别（11-08 按错题复盘改，评分口径和门槛不变）：
1. 叠图上的印刷字单独一栏「叠图字」，不再混进「目标文字」（v1 两道硬猜是这个原因，标注说明本来就要求叠图字另记）。
2. 写明「口头用法」：「这个人」「这个事情」这类即使手刚好在板上也算「否」（v1 两道硬猜是把手的位置当成了指代）。
3. 「目标文字」只写手指停的那一处看得清的手写字。
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
NAME_CFG = sys.argv[1]
URL, NAME, KEYF, EXTRA = CFG[NAME_CFG]
KEY = Path(KEYF).expanduser().read_text().strip()
DESC = '图片依次是：讲者手部停顿的整帧和对应的手部放大裁片（成对出现，按「整帧、裁片」排列），最后一张（如有）是手指所在位置没被身体挡住时的板面放大裁片。'


def prompt(q):
    return (f'这是一段讲课视频。讲者说了这样一句话（语音转写，可能有错字）：「……{q["上下文"]}……」，其中说到「{q["词"]}」。\n'
            f'{DESC}\n\n'
            '请判断：讲者说这个词时，有没有用手、粉笔或教鞭指着画面里的某处；如果有，指的是哪里。\n\n'
            '判断规则：\n'
            '1. 「是」= 这个词就是在指手所指的那一处（例如说「天喜星在这里」时，手正指着黑板上写天喜的位置）。\n'
            '2. 「否」= 这个词只是说话习惯或指话题（如「这个人」「这个事情」「这个时候」），而且手并没有在指它说的那样东西。如果手正指着黑板上写的、和这个词说的是同一样东西（例如说「这个时」时手指着板上写的「時」），算「是」。\n'
            '3. 「看不出」= 手伸出画面、被身体或叠图挡住、或者说话和手势对不上，画面判断不了。\n'
            '4. 只依据画面看得见的内容，不要根据讲课内容、紫微知识或常识去补字。\n'
            '5. 「目标文字」只写手指停的那一处黑板或讲义上看得清的手写字；看不清、被挡住、或指的地方没有字，就留空。\n'
            '6. 画面上后期贴的电子命盘（白底印刷字的宫位格、表格）不是讲者写的。手指在叠图附近时，把叠图上的字写进「叠图字」，不要写进「目标文字」。\n\n'
            '只输出一个 JSON，不要其他文字：\n'
            '{"是指代": "是/否/看不出", "指向": "黑板/叠图/讲义/自己身上/其他/无", "目标文字": "", "叠图字": "", '
            '"宫位或盘": "能从画面看出的宫位、大限格或第几张盘，看不出留空", "格": 1到9的整数或null, "依据": "一句话"}\n'
            '其中「格」= 所指位置在第 1 张整帧画面里的格（横竖三等分，左上 1、右上 3、左下 7、右下 9）。')


def call(content):
    body = {'model': NAME, 'messages': [{'role': 'user', 'content': content}], **EXTRA}
    req = urllib.request.Request(URL, json.dumps(body).encode(), {'Content-Type': 'application/json', 'Authorization': f'Bearer {KEY}'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=900) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise
            time.sleep(15 * (attempt + 1))


OUT = EXP / '输出' / f'{NAME_CFG}-B-无线索-{sys.argv[2] if len(sys.argv) > 2 else "v2"}.jsonl'


def run(q):
    d = EXP / '题' / q['题号'] / 'B'
    content = [{'type': 'text', 'text': prompt(q)}]
    for f in sorted(d.glob('*.jpg')):
        content.append({'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,' + base64.b64encode(f.read_bytes()).decode()}})
    t = time.time()
    try:
        d_ = call(content)
    except Exception as e:
        print(q['题号'], '出错', str(e)[:150], flush=True)
        return None
    text = d_['choices'][0]['message'].get('content') or ''
    m = re.search(r'\{.*\}', text, re.S)
    try:
        parsed = json.loads(m.group(0)) if m else None
    except Exception:
        parsed = None
    rec = {'题号': q['题号'], '答': parsed, '原始回答': text, 'usage': d_.get('usage'), '图数': len(content) - 1, '秒': round(time.time() - t, 1)}
    with OUT.open('a') as fh:  # 逐题落盘
        fh.write(json.dumps(rec, ensure_ascii=False) + '\n')
    return rec


def main():
    qs = json.loads((EXP / '题目清单.json').read_text())
    done = {json.loads(l)['题号'] for l in OUT.open()} if OUT.exists() else set()
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(run, [q for q in qs if q['题号'] not in done]))
    res = [json.loads(l) for l in OUT.open()]
    pt = sum((r['usage'] or {}).get('prompt_tokens', 0) for r in res); ct = sum((r['usage'] or {}).get('completion_tokens', 0) for r in res)
    print(f'{OUT.stem}：{len(res)}/90 题，解析失败 {sum(r["答"] is None for r in res)}；输入 {pt}，输出 {ct} token')


if __name__ == '__main__':
    main()

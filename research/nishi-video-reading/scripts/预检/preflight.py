"""DeepSeek 预检：量 18 张图各自实际消耗多少 token（关思考）。

用法：python3 preflight.py
- 原帧来自腾讯云全帧（已按清单 sha256 校验），每张切 6 种输入，共 18 张。
- 先发一次纯文字请求当基准；每张图单独发一次，prompt_tokens 减基准 = 这张图的 token。
- 让模型用 10 个字以内描述图片，顺便确认它真的看到了图。
结果写入 结果.jsonl 和 结果.md。
"""
import base64
import io
import json
import os
import time
import urllib.request
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
KEY = Path('~/.config/nishi-study/deepseek.key').expanduser().read_text().strip()
URL = 'https://api.deepseek.com/chat/completions'
PROMPT = '用不超过10个字描述这张图片的内容。如果没有收到图片，只回答：无图。'


def call(content):
    body = {
        'model': 'deepseek-flash',
        'messages': [{'role': 'user', 'content': content}],
        'thinking': {'type': 'disabled'},
        'max_tokens': 30,
    }
    req = urllib.request.Request(URL, json.dumps(body).encode(), {
        'Content-Type': 'application/json', 'Authorization': f'Bearer {KEY}'})
    t = time.time()
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.load(r)
    return d, time.time() - t


def jpeg_b64(img):
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=95)
    return base64.b64encode(buf.getvalue()).decode(), len(buf.getvalue())


def variants(img):
    w, h = img.size
    cx, cy = w // 2, h // 2
    def box(s):
        return img.crop((cx - s // 2, cy - s // 2, cx - s // 2 + s, cy - s // 2 + s))
    return [
        ('整帧', img, None),
        ('整帧-低清档', img, 'low'),
        ('四分之一块', img.crop((0, 0, w // 2, h // 2)), None),
        ('544方块', box(544), None),
        ('700方块', box(700), None),
        ('300方块', box(300), None),
    ]


def main():
    out = HERE / '结果.jsonl'
    if out.exists():
        raise SystemExit('已有结果，不覆盖')
    base, _ = call([{'type': 'text', 'text': PROMPT}])
    base_tokens = base['usage']['prompt_tokens']
    rows = [{'名称': '纯文字基准', 'prompt_tokens': base_tokens, '回答': base['choices'][0]['message']['content']}]
    for f in sorted((HERE / '原帧').glob('*.jpg')):
        img = Image.open(f).convert('RGB')
        for name, im, detail in variants(img):
            b64, nbytes = jpeg_b64(im)
            part = {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}
            if detail:
                part['image_url']['detail'] = detail
            d, sec = call([{'type': 'text', 'text': PROMPT}, part])
            u = d['usage']
            rows.append({
                '名称': f'{f.stem}·{name}', '尺寸': f'{im.size[0]}×{im.size[1]}', 'detail': detail or '默认',
                '字节': nbytes, 'prompt_tokens': u['prompt_tokens'], '图片token': u['prompt_tokens'] - base_tokens,
                'completion_tokens': u['completion_tokens'], '秒': round(sec, 1),
                '回答': d['choices'][0]['message']['content'], 'usage原文': u,
            })
            print(rows[-1]['名称'], rows[-1]['尺寸'], rows[-1]['图片token'], rows[-1]['回答'], flush=True)
    with out.open('w') as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    lines = ['| 输入 | 尺寸 | detail | 图片 token | 回答 |', '|---|---|---|---|---|']
    lines += [f"| {r['名称']} | {r.get('尺寸', '')} | {r.get('detail', '')} | {r.get('图片token', r['prompt_tokens'])} | {r['回答']} |" for r in rows]
    (HERE / '结果.md').write_text('# DeepSeek 预检结果（关思考）\n\n' + '\n'.join(lines) + '\n')


if __name__ == '__main__':
    main()

"""Kimi 预检：用官方估算接口（不计费）量同样 18 张图的 token。

用法：python3 kimi_estimate.py
输入与 preflight.py 完全相同（同一批原帧、同样 6 种切法）；Kimi 不认 detail 参数，「低清档」那一种照样传，看它是否忽略。
结果写入 Kimi估算.jsonl 和 Kimi估算.md。
"""
import json
import urllib.request
from pathlib import Path

from PIL import Image

from preflight import PROMPT, jpeg_b64, variants

HERE = Path(__file__).resolve().parent
KEY = Path('~/.config/nishi-study/kimi.key').expanduser().read_text().strip()
URL = 'https://api.moonshot.cn/v1/tokenizers/estimate-token-count'


def estimate(content):
    body = {'model': 'kimi-k3.1-pro', 'messages': [{'role': 'user', 'content': content}]}
    req = urllib.request.Request(URL, json.dumps(body).encode(), {
        'Content-Type': 'application/json', 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def main():
    out = HERE / 'Kimi估算.jsonl'
    if out.exists():
        raise SystemExit('已有结果，不覆盖')
    base = estimate([{'type': 'text', 'text': PROMPT}])
    base_tokens = base['data']['total_tokens']
    rows = [{'名称': '纯文字基准', 'total_tokens': base_tokens}]
    for f in sorted((HERE / '原帧').glob('*.jpg')):
        img = Image.open(f).convert('RGB')
        for name, im, detail in variants(img):
            b64, _ = jpeg_b64(im)
            part = {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}
            if detail:
                part['image_url']['detail'] = detail
            d = estimate([{'type': 'text', 'text': PROMPT}, part])
            t = d['data']['total_tokens']
            rows.append({'名称': f'{f.stem}·{name}', '尺寸': f'{im.size[0]}×{im.size[1]}',
                         'detail': detail or '默认', 'total_tokens': t, '图片token': t - base_tokens})
            print(rows[-1]['名称'], rows[-1]['尺寸'], rows[-1]['图片token'], flush=True)
    with out.open('w') as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    lines = ['| 输入 | 尺寸 | detail | 图片 token |', '|---|---|---|---|']
    lines += [f"| {r['名称']} | {r.get('尺寸', '')} | {r.get('detail', '')} | {r.get('图片token', r['total_tokens'])} |" for r in rows]
    (HERE / 'Kimi估算.md').write_text('# Kimi K3.1 Pro 估算接口结果（不计费）\n\n' + '\n'.join(lines) + '\n')


if __name__ == '__main__':
    main()

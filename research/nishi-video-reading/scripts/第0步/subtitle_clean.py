"""试点第一步（续）：把苹果识别的原始结果清洗成字幕参照轨。用法：python subtitle_clean.py P17

输入：字幕/苹果识别/原始/<集>-上.jsonl、<集>-下.jsonl（subtitle_track.py 产出，每 6 帧一个采样点）
规则（全部来自对两集原始结果的统计，见工作记录）：
1. 选字幕行：字幕永远是一行、水平居中、在字幕带中部（行中心高度 0.28–0.65）。
   同一高度上相邻的几块先拼起来（苹果有时把一句拆成两块，如「军人。」「警察、法官」），
   拼后中心离画面正中 ≤ 0.04 记「居中」；盖住正中、偏离 ≤ 0.12 记「偏心」（多半是左边粘了叠图上的数字），照收但标出；
   其余（叠图、板书、角标的零碎字）不收。去掉水印和片头标题卡。
2. 归一：去掉汉字之间的空格（苹果对同一句时而加空格、时而不加）。
3. 并句：相邻采样点文字相似（去标点后相似度 ≥ 0.6）算同一句；中间夹 1–2 个读错或空白的采样点，
   只要后面又回到同一句，就当识别抖动并进去。
4. 每句取出现最多的写法当定稿（按可信度加权，平票取长的），并记下一致率：一句里有多少采样点读成了定稿这个样子。
输出：字幕/苹果识别/<集>.jsonl，每行 {序号, 起帧, 止帧, 起秒, 止秒, 字幕, 采样数, 一致率, 可信, 标记}
帧号是原片帧号（30 帧/秒）；起帧 = 第一个采样帧，止帧 = 最后一个采样帧 + 5（采样间隔 6 帧，边界误差 ≤ 0.2 秒）。
"""
import json
import re
import sys
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EP = sys.argv[1]
SRC = ROOT.parent / '字幕' / '苹果识别' / '原始'
OUT = ROOT.parent / '字幕' / '苹果识别' / f'{EP}.jsonl'
CJK = re.compile(r'[一-鿿]')
WM = re.compile(r'程心学|心学|精准字幕|配图|校天纪|@')
PUNCT = re.compile(r'[\s，,。.、！!？?：:；;“”"\'‘’（）()《》\-—~～·…]')


def norm(t):
    t = re.sub(r'(?<=[一-鿿])\s+(?=[一-鿿])', '', t.strip())
    return re.sub(r'\s+', ' ', t)


def key(t):
    return PUNCT.sub('', t)


def pick(lines):
    """返回 (文字, 可信, 标记) 或 None。"""
    band = []
    for x in lines:
        bx, by, bw, bh = x['框']
        yc = by + bh / 2
        if 0.28 <= yc <= 0.65 and CJK.search(x['字']) and not WM.search(x['字']):
            band.append((bx, bx + bw, yc, x))
    if not band:
        return None
    band.sort(key=lambda b: b[0])
    groups = []
    for b in band:
        g = groups[-1] if groups else None
        if g and abs(b[2] - g['yc']) < 0.08 and b[0] - g['x1'] < 0.06:
            g['x1'] = max(g['x1'], b[1])
            g['items'].append(b[3])
        else:
            groups.append({'x0': b[0], 'x1': b[1], 'yc': b[2], 'items': [b[3]]})
    best = None
    for g in groups:
        cx = (g['x0'] + g['x1']) / 2
        off = abs(cx - 0.5)
        if off <= 0.04:
            tag = '居中'
        elif g['x0'] < 0.5 < g['x1'] and off <= 0.12:
            tag = '偏心'
        else:
            continue
        if best is None or off < best[0]:
            best = (off, g, tag)
    if best is None:
        return None
    _, g, tag = best
    text = norm(' '.join(x['字'] for x in g['items']))
    conf = min(x['可信'] for x in g['items'])
    if len(g['items']) > 1:
        tag += '·拼接'
    return text, conf, tag


def sim(a, b):
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def main():
    rows = []
    for part in ['上', '下']:
        p = SRC / f'{EP}-{part}.jsonl'
        if p.exists():
            rows += [json.loads(l) for l in p.open()]
    rows.sort(key=lambda r: r['帧'])
    samples = []
    for r in rows:
        got = pick(r['行'])
        if got:
            samples.append({'帧': r['帧'], '字': got[0], 'k': key(got[0]), '可信': got[1], '标记': got[2]})
        else:
            samples.append({'帧': r['帧'], '字': '', 'k': '', '可信': 0, '标记': ''})

    segs = []
    cur = None
    i = 0
    n = len(samples)
    while i < n:
        s = samples[i]
        if cur is not None:
            ref = Counter(x['k'] for x in cur if x['k']).most_common(1)[0][0]
            if s['k'] and sim(s['k'], ref) >= 0.6:
                cur.append(s)
                i += 1
                continue
            # 抖动：后面 1–2 个采样点内又回到同一句，就把中间的并进来
            back = None
            for j in (i + 1, i + 2):
                if j < n and samples[j]['k'] and sim(samples[j]['k'], ref) >= 0.6:
                    back = j
                    break
            if back is not None:
                cur.extend(samples[i:back])
                i = back
                continue
            segs.append(cur)
            cur = None
        if s['k']:
            cur = [s]
        i += 1
    if cur:
        segs.append(cur)

    with OUT.open('w') as fh:
        for no, seg in enumerate(segs, 1):
            real = [x for x in seg if x['k']]
            w = defaultdict(float)
            for x in real:
                w[x['字']] += 0.2 + x['可信']
            text = max(w, key=lambda t: (w[t], len(t)))
            k = key(text)
            agree = sum(1 for x in real if x['k'] == k) / len(real)
            tags = Counter(x['标记'] for x in real if x['k'] == k)
            mark = []
            if any('偏心' in t for t in tags):
                mark.append('偏心')
            if any('拼接' in t for t in tags):
                mark.append('拼接')
            if len(real) == 1:
                mark.append('单采样')
            if re.search(r'[0-9A-Za-z]', text):
                mark.append('含数字字母')
            a, b = seg[0]['帧'], seg[-1]['帧'] + 5
            fh.write(json.dumps({'序号': no, '起帧': a, '止帧': b, '起秒': round(a / 30, 2), '止秒': round((b + 1) / 30, 2),
                                 '字幕': text, '采样数': len(seg), '一致率': round(agree, 2),
                                 '可信': round(sum(x['可信'] for x in real) / len(real), 2), '标记': mark},
                                ensure_ascii=False) + '\n')
    print(EP, '采样', n, '有字幕', sum(1 for s in samples if s['k']), '句', len(segs))


if __name__ == '__main__':
    main()

"""粉笔字三路证据小测（第一版，只用已有数据，不调接口）。用法：python chalk_evidence.py

对象：实验 3 的 30 格板书（10 个抽样段各 3 格），标准答案（Claude Opus 5.5 high）228 个字位、认得出 82 个（约 36%）。
三路证据：
  画面：标准答案 + Claude xhigh 两遍独立转写（claude-xhigh-裁片1/2）。
  口述：whisper 逐字时间，取这格稳定状态前 W 秒到状态结束后 10 秒说过的字。
  电子盘：叠图定稿里同一集、时间在这格状态前后 W 秒内的叠图印刷字。
对照（防「碰巧对上」）：同一格的字拿去对另一个片段同长度的语音 / 叠图，算偶然命中率。

分级（看结果前定）：
  甲 = 画面两遍一致（标准答案认得出，或 xhigh 两遍都写了）+ 有口述或电子盘旁证
  乙 = 画面两遍一致但无旁证；或画面只一遍写了 + 有旁证
  丙 = 画面看不清，只有口述（只能给候选，本版不计入覆盖）
  空 = 都没有
覆盖率按字位估：每格 甲+乙 的字数（不超过这格字位数）/ 228。
数字统一成阿拉伯数字比；常用虚字（的了是这个一）不算旁证，免得虚高。
"""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXP = ROOT / '小考' / '实验3'
SKIP = set('□ 、，。．·.,-—~～()（）「」:：;；/\\')
WEAK = set('的了是这个一你我他她它们在有也就都和与吗呢啊吧')
CN = str.maketrans('〇零一二三四五六七八九', '00123456789')


def chars(lines):
    return [c for c in ''.join(lines or []).translate(CN) if c not in SKIP and c.strip()]


def load_gt():
    gt = {}
    for f in (EXP / '标准答案').glob('*.json'):
        for a in json.loads(f.read_text()):
            gt[a['题号']] = a
    return gt


def speech(seg, f0, f1, W):
    meta = json.loads((ROOT / '片段' / seg / '摘要.json').read_text())
    s0 = meta['起始帧'] / meta['fps']
    t0, t1 = f0 / 30 - W, f1 / 30 + 10
    out = []
    for w in json.loads((ROOT / '片段' / seg / '字词.json').read_text())['transcription']:
        t = s0 + w['offsets']['from'] / 1000
        if t0 <= t <= t1:
            out.append(w['text'])
    return Counter(c for c in ''.join(out).translate(CN) if c.strip())


OV = [json.loads(l) for l in (ROOT / '叠图转写' / '叠图定稿.jsonl').open()]


def overlay(ep, f0, f1, W):
    t0, t1 = f0 / 30 - W, f1 / 30 + W
    s = ''
    for r in OV:
        if r['集'] == ep and r['止秒'] >= t0 and r['起秒'] <= t1:
            s += ''.join(k + ''.join(v) for k, v in (r.get('格') or {}).items()) + ''.join(r.get('格外文字') or [])
    return Counter(c for c in s.translate(CN) if c.strip())


def run(W):
    gt = load_gt()
    qs = json.loads((EXP / '题目清单.json').read_text())
    x1 = {r['题号']: (r['答'] or {}) for r in map(json.loads, (EXP / '输出' / 'claude-xhigh-裁片1.jsonl').open())}
    x2 = {r['题号']: (r['答'] or {}) for r in map(json.loads, (EXP / '输出' / 'claude-xhigh-裁片2.jsonl').open())}
    segs = sorted({q['片段'] for q in qs})
    tot_pos = 0
    grade = Counter()
    sup_gt = sup_ctrl = n_gt = 0
    cov = 0
    for q in qs:
        a = gt[q['题号']]
        pos = len([c for c in ''.join(a['转写']) if c not in SKIP - {'□'} and c.strip()])
        tot_pos += pos
        g = Counter(chars(a['转写']))
        r1, r2 = Counter(chars(x1[q['题号']].get('转写'))), Counter(chars(x2[q['题号']].get('转写')))
        both = (r1 & r2) | g          # 画面两遍一致：标准答案认得出，或 xhigh 两遍都写
        once = (r1 | r2) - both       # 画面只一遍写了
        sp = speech(q['片段'], q['起'], q['止'], W)
        ov = overlay(q['集'], q['起'], q['止'], W)
        other = segs[(segs.index(q['片段']) + 5) % len(segs)]  # 对照：错开 5 个片段的同格时间
        oq = next(x for x in qs if x['片段'] == other)
        sp_c = speech(other, oq['起'], oq['止'], W)
        ov_c = overlay(oq['集'], oq['起'], oq['止'], W)
        sup = lambda c, S, O: c not in WEAK and (S[c] > 0 or O[c] > 0)
        for c in g.elements():
            n_gt += 1
            sup_gt += sup(c, sp, ov)
            sup_ctrl += sup(c, sp_c, ov_c)
        a_ = sum(n for c, n in both.items() if sup(c, sp, ov))
        b_ = sum(n for c, n in both.items() if not sup(c, sp, ov)) + sum(n for c, n in once.items() if sup(c, sp, ov))
        grade['甲'] += a_
        grade['乙'] += b_
        cov += min(pos, a_ + b_)
    return {'窗口秒': W, '字位': tot_pos, '标准答案认得出': n_gt, '认得出的字有旁证': f'{sup_gt}/{n_gt} = {sup_gt / n_gt:.0%}',
            '对照（错位片段）偶然命中': f'{sup_ctrl}/{n_gt} = {sup_ctrl / n_gt:.0%}', '甲': grade['甲'], '乙': grade['乙'],
            '甲乙覆盖字位': f'{cov}/{tot_pos} = {cov / tot_pos:.0%}'}


if __name__ == '__main__':
    for W in (20, 60, 120):
        print(json.dumps(run(W), ensure_ascii=False))

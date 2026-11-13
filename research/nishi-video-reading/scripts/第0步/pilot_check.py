"""试点逐帧层验收。用法：python pilot_check.py <名> <集>

1. 完整性：窗数、调用失败、格式失败、帧覆盖。
2. 字幕核读（「到底看没看」）：每帧模型抄的字幕对苹果参照轨（字幕/苹果识别/<集>.jsonl）。
   去标点空格后：一致 / 相近（相似度 ≥ 0.8，多为形近字，如夭↔天、戊↔成）/ 不同 / 模型漏抄 / 模型多抄。
   另数「偷懒窗」：苹果轨在窗内换了句，模型整窗却只抄出一句。
3. 对小考标准答案（Claude 看原帧标的，只计「确定」字段）：触板、在写、动作。
4. 叠图变化对叠图状态边界（叠图状态/<集>.json，1 秒精度）：模型报「变化」的帧离边界 ≤ 1 秒算对上；
   窗内每个边界 ±1 秒内有没有报「变化」。
"""
import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NAME, EP = sys.argv[1], sys.argv[2]
PUNCT = re.compile(r'[\s，,。.、！!？?：:；;“”"\'‘’（）()《》\-—~～·…]')


def key(t):
    return PUNCT.sub('', t or '')


def main():
    rows = [json.loads(l) for l in (ROOT / '逐帧层' / NAME / f'{EP}.jsonl').open()]
    best = {}
    for r in rows:                       # 同一窗多次记录取成功那次
        if r['窗'] not in best or r.get('行'):
            best[r['窗']] = r
    ok = [r for r in best.values() if r.get('行')]
    per = {}
    for r in ok:
        # ★ 11-10：帧号以出图时烧进去的序号为准（第 k 行 = 本窗第 k 帧）；P17 有 54 窗模型把帧号多抄一位（4464→44664），
        #   行数、顺序都对，按模型自报帧号统计会把这几百帧算成「多抄」。行数对不上时才退回模型自报帧号。
        same = len(r['行']) == len(r['帧'])
        for k, x in enumerate(r['行']):
            per[r['帧'][k] if same else x['f']] = x
    fails = len(best) - len(ok)
    print(f'【完整性】{len(best)} 窗，成功 {len(ok)}，失败 {fails}；覆盖 {len(per)} 帧')
    bad_f = [r['窗'] for r in ok if [x['f'] for x in r['行']] != r['帧']]
    if bad_f:
        print(f'  模型抄错帧号的窗 {len(bad_f)}（已按序号对回）：{bad_f[:10]}')

    # 2 字幕
    segs = [json.loads(l) for l in (ROOT.parent / '字幕' / '苹果识别' / f'{EP}.jsonl').open()]
    ref = {}
    for s in segs:
        for f in range(s['起帧'], s['止帧'] + 1):
            ref[f] = s
    c = dict(一致=0, 相近=0, 不同=0, 模型漏抄=0, 模型多抄=0, 都无=0)
    examples = []
    for f, x in sorted(per.items()):
        a, m = key((ref.get(f) or {}).get('字幕')), key(x.get('字幕'))
        if not a and not m:
            c['都无'] += 1
        elif a and not m:
            c['模型漏抄'] += 1
        elif m and not a:
            c['模型多抄'] += 1
        elif a == m:
            c['一致'] += 1
        elif SequenceMatcher(None, a, m).ratio() >= 0.8:
            c['相近'] += 1
        else:
            c['不同'] += 1
            examples.append((f, ref[f]['字幕'], x.get('字幕')))
    n = len(per)
    print('【字幕核读】' + '，'.join(f'{k} {v}（{v / n:.1%}）' for k, v in c.items()))
    lazy = 0
    for r in ok:
        aset = {ref[f]['序号'] for f in r['帧'] if f in ref}
        mset = {key(x.get('字幕')) for x in r['行'] if key(x.get('字幕'))}
        if len(aset) >= 2 and len(mset) <= 1:
            lazy += 1
    print(f'  偷懒窗（苹果轨窗内换句、模型整窗只一句）：{lazy}/{len(ok)}')
    for e in examples[:8]:
        print('  不同例：帧', e[0], '苹果：', e[1], '｜模型：', e[2])

    # 3 小考标准答案
    gt = {}
    for p in (ROOT / '小考' / '实验2' / '标准答案').glob(f'*{EP}.json'):
        for k, v in json.loads(p.read_text()).items():
            if k != '备注':
                for g in v:
                    gt[g['f']] = g
    hit = [f for f in gt if f in per]
    if hit:
        st = {k: [0, 0] for k in ['触板', '在写', '动作', '手可见']}
        for f in hit:
            g, p = gt[f], per[f]
            conf = g.get('把握', {})
            for k, sure, okk in [('触板', conf.get('触板') == '确定', p.get('触板') == g['触板']),
                                 ('在写', conf.get('动作') == '确定', (p.get('动作') == '写') == (g['动作'] == '写')),
                                 ('动作', conf.get('动作') == '确定', p.get('动作') == g['动作']),
                                 ('手可见', True, p.get('手可见') == g['手可见'])]:
                if sure:
                    st[k][1] += 1
                    st[k][0] += okk
        print(f'【对小考标准答案】{len(hit)} 帧：' + '，'.join(f'{k} {a}/{b}' for k, (a, b) in st.items() if b))
    else:
        print('【对小考标准答案】本批没有落在标准答案上的帧')

    # 4 叠图变化
    st = json.loads((ROOT / '叠图状态' / f'{EP}.json').read_text())
    bounds = sorted({s['起'] for s in st} | {s['止'] + 1 for s in st})
    fr = sorted(per)
    lo, hi = fr[0] / 30, fr[-1] / 30
    inb = [b for b in bounds if lo + 1 <= b <= hi - 1]
    rep = [f for f in fr if per[f].get('叠图变化') and f not in [r['帧'][0] for r in ok]]
    near = sum(1 for f in rep if any(abs(f / 30 - b) <= 1.0 for b in bounds))
    got = sum(1 for b in inb if any(per[f].get('叠图变化') for f in fr if abs(f / 30 - b) <= 1.0))
    print(f'【叠图变化】模型报变化 {len(rep)} 帧（不含每窗第一张），其中离叠图边界 ≤1 秒 {near}；'
          f'本批范围内叠图边界 {len(inb)} 个，±1 秒内报了变化的 {got}')


if __name__ == '__main__':
    main()

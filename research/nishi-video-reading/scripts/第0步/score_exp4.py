"""实验 4（指代）打分。用法：python score_exp4.py

只用标准答案「确定」的题计分，「不确定」计入剔除。对每组输出（模型 × 包 × 线索）报：
- 确认率：标准答案「是指代」的题里，模型也答「是」且目标对上（目标文字有共同字，或格号相同）。
- 指错率：模型答「是」并给出目标的题里，目标对不上的比例（只在标准答案为「是」的题上算）。
- 硬猜率：模型写出了目标文字，而标准答案这题看不到字（目标文字为空）或根本不是指代。
- 口头用法识别：标准答案「否」的题里，模型答「否」或「看不出」的比例。
另报两家一致率（同包同线索，「是指代」与格号都相同），以及有 / 无线索的差。
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent / '小考' / '实验4'


def load_gt():
    gt = {}
    for f in (ROOT / '标准答案').glob('*.json'):
        for a in json.loads(f.read_text()):
            gt[a['题号']] = a
    return gt


def chars(s):
    return {c for c in (s or '') if c.strip() and c not in '□、，。,.()（）'}


def match(g, a):
    if chars(g['目标文字']) and chars(a.get('目标文字')) & chars(g['目标文字']):
        return True
    return g.get('格') is not None and a.get('格') == g.get('格')


def main():
    gt = load_gt()
    sure = {k: v for k, v in gt.items() if v['把握'] == '确定'}
    yes = {k: v for k, v in sure.items() if v['是指代'] == '是'}
    no = {k: v for k, v in sure.items() if v['是指代'] == '否'}
    print(f'标准答案 {len(gt)} 题；确定 {len(sure)}（是指代 {len(yes)}，否 {len(no)}）；剔除 {len(gt) - len(sure)}（{(len(gt) - len(sure)) / max(len(gt), 1):.0%}）')
    outs = {}
    for f in sorted((ROOT / '输出').glob('*.jsonl')):
        outs[f.stem] = {r['题号']: (r['答'] or {}) for r in map(json.loads, f.open())}
    for name, o in outs.items():
        conf = sum(1 for k, g in yes.items() if o.get(k, {}).get('是指代') == '是' and match(g, o.get(k, {})))
        concl = [k for k, g in yes.items() if o.get(k, {}).get('是指代') == '是' and (chars(o[k].get('目标文字')) or o[k].get('格'))]
        wrong = sum(1 for k in concl if not match(yes[k], o[k]))
        guess_pool = [k for k, g in sure.items() if not chars(g['目标文字']) or g['是指代'] != '是']
        guess = sum(1 for k in guess_pool if chars(o.get(k, {}).get('目标文字')))
        noacc = sum(1 for k in no if o.get(k, {}).get('是指代') in ('否', '看不出'))
        print(f'{name:22s} 确认率 {conf}/{len(yes)}  指错 {wrong}/{len(concl)}  硬猜 {guess}/{len(guess_pool)}  口头用法识别 {noacc}/{len(no)}')
    for pkg in 'AB':
        for clue in ['无线索', '有线索']:
            a, b = outs.get(f'deepseek-{pkg}-{clue}'), outs.get(f'kimi-{pkg}-{clue}')
            if a and b:
                same = sum(1 for k in gt if a.get(k, {}).get('是指代') == b.get(k, {}).get('是指代') and a.get(k, {}).get('格') == b.get(k, {}).get('格'))
                print(f'两家一致（{pkg} 包 {clue}）：{same}/{len(gt)}')


if __name__ == '__main__':
    main()

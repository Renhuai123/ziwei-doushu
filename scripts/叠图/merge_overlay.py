"""合成叠图定稿。用法：python merge_overlay.py
输入：叠图状态/Pxx.json（全部 2,645 个状态，含「重复于」）、叠图转写/ 两遍转写、两遍比对、裁定（API 59 张 + 子代理 裁定批/结果-*.json）、单遍核对结果（如有）。
输出：叠图转写/叠图定稿.jsonl（每个状态一行）+ 终端汇总。

每个新状态的依据：
- 两遍一致：两遍逐格逐字一致（比对口径见 compare_overlay.py）。
- 裁定：两遍对不上的格，以第三次看原图的裁定为准；对得上的格照两遍一致的内容。
- 单遍＋核对：只有一遍结果（接口断流 / 额度用完），由子代理对原图逐字核对后的内容。
- 单遍未复核：只有一遍、也还没核对（列出来，不当定稿用）。
重复状态（「重复于」）直接引用首次出现那张的定稿内容，依据照抄并注明「重复于」。
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
D = ROOT / '叠图转写'
import compare_overlay as C  # 复用同一套归一化与配格口径


def load_jsonl(p):
    return {r['编号']: r for r in map(json.loads, p.open())} if p.exists() else {}


def main():
    p1 = load_jsonl(D / 'claude-opus55-xhigh.jsonl')
    p2 = load_jsonl(D / 'claude-opus55-xhigh-第二遍.jsonl')
    cmp = load_jsonl(D / '两遍比对.jsonl')
    adj = {}
    for k, r in load_jsonl(D / '裁定.jsonl').items():
        if r.get('答'):
            adj[k] = r['答'].get('裁定') or []
    for f in sorted((D / '裁定批').glob('结果-*.json')):
        for r in json.loads(f.read_text()):
            adj.setdefault(r['编号'], r.get('裁定') or [])
    single = {}
    sf = D / '单遍核对' / '结果.json'
    if sf.exists():
        for r in json.loads(sf.read_text()):
            single[r['编号']] = r

    final, stat = {}, {}
    for k in sorted(set(p1) | set(p2)):
        if k in p1 and k in p2 and k in cmp:
            c1, l1 = C.cells(p1[k]['答'])
            if cmp[k]['一致']:
                final[k] = {'依据': '两遍一致', '格': c1, '格外文字': l1}
            elif k in adj:
                cells, lines = dict(c1), list(l1)
                for d in adj[k]:
                    where, toks = d.get('处', ''), [t for t in (C.tok(x) for x in d.get('印刷字') or []) if t]
                    if where == '格外文字':
                        # 格外文字以裁定为准：两遍对得上的保留，分歧部分换成裁定给的印刷字
                        diff = [y for y in cmp[k]['差异'] if '文字行' in y]
                        gone = set(diff[0]['文字行']['第一遍独有']) | set(diff[0]['文字行']['第二遍独有']) if diff else set()
                        lines = sorted((set(l1) - gone) | set(toks))
                    elif toks:
                        cells[where] = toks
                    else:
                        cells.pop(where, None)  # 裁定这一处没有印刷字（如「只在一遍」的格被判为不存在）
                final[k] = {'依据': '裁定', '格': cells, '格外文字': lines, '裁定': adj[k]}
            else:
                final[k] = {'依据': '待裁定', '格': c1, '格外文字': l1}
        else:
            src = p1.get(k) or p2.get(k)
            c, l = C.cells(src['答'])
            if k in single:
                s = single[k]
                sc = {C.norm(kk): [t for t in (C.tok(x) for x in v) if t] for kk, v in (s.get('格') or {}).items()}
                sl = sorted(t for t in (C.tok(x) for x in s.get('格外文字') or []) if t)
                final[k] = {'依据': '单遍＋核对', '格': sc, '格外文字': sl, '核对改动': s.get('改动') or []}
            else:
                final[k] = {'依据': '单遍未复核', '格': c, '格外文字': l}
    out = D / '叠图定稿.jsonl'
    n = 0
    with out.open('w') as fh:
        for f in sorted((ROOT / '叠图状态').glob('P*.json')):
            for s in json.loads(f.read_text()):
                k = s['编号']
                base = final.get(s['重复于'] or k)
                rec = {'编号': k, '集': k.split('_')[0], '起秒': s['起'], '止秒': s['止'], '代表帧号': s['帧号'], '重复于': s['重复于']}
                if base is None:
                    rec['依据'] = '无转写'
                else:
                    rec.update({kk: vv for kk, vv in base.items()})
                    if s['重复于']:
                        rec['依据'] = base['依据'] + '（重复于 ' + s['重复于'] + '）'
                stat[rec['依据'].split('（')[0]] = stat.get(rec['依据'].split('（')[0], 0) + 1
                fh.write(json.dumps(rec, ensure_ascii=False) + '\n')
                n += 1
    print(f'叠图状态 {n} 个 → {out.name}')
    for k, v in sorted(stat.items(), key=lambda x: -x[1]):
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()

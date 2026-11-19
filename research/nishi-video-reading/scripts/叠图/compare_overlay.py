"""叠图两遍独立转写逐格比对。用法：python compare_overlay.py
输入：叠图转写/claude-opus55-xhigh.jsonl（第一遍）、claude-opus55-xhigh-第二遍.jsonl（第二遍，加了「繁体照抄」）。
输出：叠图转写/两遍比对.jsonl（每张：一致 / 有差异 + 差异明细）、终端汇总。

比对口径（看结果前定）：
- 只比印刷字内容：宫名、干支、星曜（含亮度、四化）、其他字、文字行；「位置」「备注」等描述不比。
- 括号里的说明（如「（蓝框）」）、空格、标点去掉再比；□ 保留（一遍写字一遍写 □ 也算差异）。
- 命盘格按「宫名+干支」配对；配不上的格算「只在一遍里」。非命盘叠图按文字行整体比。
- 字级一致率 = 两遍字的多重集交集 / 较大的那遍字数。
"""
import json
import re
from collections import Counter
from pathlib import Path

D = Path(__file__).resolve().parent / '叠图转写'


DESC = re.compile(r'框|箭头|被|指向|连同|圈住|颜色|底色|划线|下划线|遮|挡|看不清|像是|可能')
PREFIX = re.compile(r'^(左下|右下|左上|右上|上方|下方|中间|格内|格外|绿底标签|红底标签|蓝底标签|标签|红色按钮|按钮)+')


def norm(s):
    s = re.sub(r'[（(][^）)]*[）)]', '', str(s or ''))
    s = re.sub(r'[\s,，、。.·:：;；~～\-—「」『』"“”]', '', s)
    return PREFIX.sub('', s)


def tok(s):
    """一个内容单元：描述性文字（框、箭头、遮挡说明）不算印刷字，丢掉。"""
    return '' if DESC.search(str(s or '')) else norm(s)


def load(f):
    return {r['编号']: r for r in map(json.loads, (D / f).open())} if (D / f).exists() else {}


PALACE = re.compile(r'(命|兄弟|夫妻|子女|财帛|疾厄|迁移|交友|奴仆|仆役|官禄|事业|田宅|福德|父母)')


def cells(ans):
    """命盘格按「宫名+干支」配对；星曜和其他字合成一个内容单元集（不管模型放在哪个字段）。
    没有宫名的格（中宫、出生资料格等）和非命盘叠图的文字行一起放进「格外」，避免两遍给中宫起名不同造成假差异。"""
    out = {}
    lines = []
    for b in (ans or {}).get('叠图') or []:
        if b.get('类型') == '图片':  # 面相图等：文字行多是模型对图的描述，不是印刷字，不参与逐字比对（另行统计块数）
            continue
        for c in b.get('格') or []:
            name = norm(c.get('宫名'))
            toks = [t for t in (tok(x) for x in (c.get('星曜') or []) + (c.get('其他') or [])) if t]
            if name and PALACE.search(name):
                key = name + norm(c.get('干支'))
                while key in out:
                    key += '′'
                out[key] = sorted(toks)
            else:
                lines += [t for t in [tok(c.get('宫名')), tok(c.get('干支'))] + toks if t]
        lines += [t for t in (tok(x) for x in b.get('文字行') or []) if t]
    return out, sorted(lines)


def chars(cs, lines):
    return Counter(''.join(k.rstrip('′') + ''.join(v) for k, v in cs.items()) + ''.join(lines))


def main():
    a, b = load('claude-opus55-xhigh.jsonl'), load('claude-opus55-xhigh-第二遍.jsonl')
    both = sorted(set(a) & set(b))
    res, n_same, cell_tot, cell_same, ch_hit, ch_max = [], 0, 0, 0, 0, 0
    for k in both:
        c1, l1 = cells(a[k]['答'])
        c2, l2 = cells(b[k]['答'])
        diffs = []
        for key in sorted(set(c1) | set(c2)):
            cell_tot += 1
            if key not in c1 or key not in c2:
                diffs.append({'格': key, '只在': '第一遍' if key in c1 else '第二遍'})
                continue
            if Counter(''.join(c1[key])) == Counter(''.join(c2[key])):  # 按字比：「太阳旺」「权」与「太阳旺权」算一致
                cell_same += 1
            else:
                x, y = Counter(c1[key]), Counter(c2[key])
                diffs.append({'格': key, '第一遍独有': sorted((x - y).elements()), '第二遍独有': sorted((y - x).elements())})
        if Counter(''.join(l1)) != Counter(''.join(l2)):
            x, y = Counter(l1), Counter(l2)
            diffs.append({'文字行': {'第一遍独有': sorted((x - y).elements()), '第二遍独有': sorted((y - x).elements())}})
        h1, h2 = chars(c1, l1), chars(c2, l2)
        ch_hit += sum((h1 & h2).values()); ch_max += max(sum(h1.values()), sum(h2.values()))
        same = not diffs
        n_same += same
        res.append({'编号': k, '一致': same, '差异': diffs})
    with (D / '两遍比对.jsonl').open('w') as fh:
        for r in res:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    print(f'两遍都有 {len(both)} 张（第一遍 {len(a)}，第二遍 {len(b)}）')
    print(f'整张完全一致 {n_same}/{len(both)} = {n_same / max(len(both), 1):.1%}')
    print(f'命盘格完全一致 {cell_same}/{cell_tot} = {cell_same / max(cell_tot, 1):.1%}')
    print(f'字级一致率 {ch_hit}/{ch_max} = {ch_hit / max(ch_max, 1):.2%}')


if __name__ == '__main__':
    main()

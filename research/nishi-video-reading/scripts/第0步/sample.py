"""第 0 步：分层抽样（固定随机种子，不手工挑）。

用法：
  python sample.py --四层   先抽四层 8 段（不依赖叠图扫描），写 分层抽样-四层.json
  python sample.py          重抽同样的四层 8 段（同一种子、同一顺序，结果相同）+ 叠图层 2 段，写 分层抽样.json

五层，每层 2 段，每段 3 分钟（5,400 帧），两段来自不同的集；起点避开片头片尾各 60 秒，按整秒对齐：
- 低码率：AV1 的 1620 宽三集 P13 P15 P17
- 中码率：其余 1620 宽 H.264 八集
- 高码率：H.264 1620 宽里码率最高的三集 P25 P19 P09
- 1920 宽：P01 P37 P48
- 叠图多：任意一集里，「有叠图」的秒数占一半以上的 3 分钟窗口（每 30 秒一个起点），且不与前四层重叠。
  「有叠图」= 叠图打分 v2（overlay2.py，白色矩形块面积占比）≥ 0.03，扫描见 叠图扫描v2/。

修订记录：11-08 第一版先抽叠图层、用 v1 打分（整列白），v1 漏掉了贴边的窄条叠图（17 集没有一个窗口过半），
在任何片段处理之前改为本版；v1 结果留在 叠图扫描/ 备查。
"""
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SEED = 20261108
SEG_SEC = 180
FPS = 30
STRATA = {
    '低码率': ['P13', 'P15', 'P17'],
    '中码率': ['P03', 'P05', 'P07', 'P11', 'P21', 'P23', 'P27', 'P29'],
    '高码率': ['P09', 'P19', 'P25'],
    '1920宽': ['P01', 'P37', 'P48'],
}
OVERLAY_T, OVERLAY_SHARE = 0.03, 0.5


def scan(ep):
    p = ROOT / '叠图扫描v2' / f'{ep}.tsv'
    return [float(l.split('\t')[1]) for l in p.read_text().splitlines()] if p.exists() else None


def frames_of(ep):
    return sum(1 for _ in open(ROOT.parent / '全帧-20261107' / '清单' / f'{ep}.tsv'))


def share(sc, s):
    return round(sum(v >= OVERLAY_T for v in sc[s:s + SEG_SEC]) / SEG_SEC, 3) if sc else None


def main():
    four_only = '--四层' in sys.argv
    out = ROOT / ('分层抽样-四层.json' if four_only else '分层抽样.json')
    if out.exists():
        raise SystemExit(f'{out.name} 已存在，不覆盖')
    rng = random.Random(SEED)
    picks = []

    def overlaps(ep, s):
        return any(p['集'] == ep and abs(p['起始秒'] - s) < SEG_SEC for p in picks)

    for name, members in STRATA.items():
        for ep in rng.sample(members, 2):
            last = frames_of(ep) // FPS - 60 - SEG_SEC
            while True:
                s = rng.randint(60, last)
                if not overlaps(ep, s):
                    break
            picks.append({'层': name, '集': ep, '起始秒': s})
    pool, overlay_eps = [], []
    if not four_only:
        eps = sorted(p.stem for p in (ROOT / '叠图扫描v2').glob('P*.tsv'))
        assert len(eps) == 17, eps
        for ep in eps:
            sc = scan(ep)
            last = min(len(sc), frames_of(ep) // FPS) - 60 - SEG_SEC
            for s in range(60, last + 1, 30):
                if share(sc, s) >= OVERLAY_SHARE and not overlaps(ep, s):
                    pool.append((ep, s))
        overlay_eps = sorted({p[0] for p in pool})
        for ep in rng.sample(overlay_eps, 2):
            e, s = rng.choice([p for p in pool if p[0] == ep])
            picks.append({'层': '叠图多', '集': e, '起始秒': s})
    for i, p in enumerate(picks, 1):
        p['片段'] = f"S{i:02d}-{p['层']}-{p['集']}"
        p['起始帧'] = p['起始秒'] * FPS
        p['帧数'] = SEG_SEC * FPS
        p['叠图秒占比'] = share(scan(p['集']), p['起始秒'])
    result = {'种子': SEED, '每段秒数': SEG_SEC, '叠图判法': 'overlay2.py v2', '有叠图阈值': OVERLAY_T,
              '叠图窗口最低占比': OVERLAY_SHARE, '叠图候选窗口数': len(pool), '有叠图窗口的集': overlay_eps,
              '分层': STRATA, '片段': picks}
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    for p in picks:
        print(p['片段'], p['起始帧'], f"{p['起始秒'] // 60}分{p['起始秒'] % 60}秒", '叠图占比', p['叠图秒占比'])


if __name__ == '__main__':
    main()

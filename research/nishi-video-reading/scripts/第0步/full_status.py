"""全量逐帧层进度（不调接口）。
用法（在 第0步/ 下）：
  python full_status.py            打印每集 已完成 / 总窗数；全部完成时退出码 0，否则 1
公开版说明：原版另有一个查 DeepSeek 账户的选项，供调度脚本做资金闸，公开版去掉了。
试点两集（P17、P05）在 逐帧层/试点/，其余 15 集在 逐帧层/全量/。
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WIN = 12
PILOT = ['P17', 'P05']
FULL = ['P01', 'P03', 'P07', 'P09', 'P11', 'P13', 'P15', 'P19', 'P21', 'P23', 'P25', 'P27', 'P29', 'P37', 'P48']


def total_windows(ep):
    n = 0
    for line in open(ROOT.parent / '全帧-20261107' / '清单' / f'{ep}.tsv'):
        n = max(n, int(line.split('\t', 1)[0]) + 1)
    return (n + WIN - 1) // WIN


def done_windows(ep, name):
    p = ROOT / '逐帧层' / name / f'{ep}.jsonl'
    done = set()
    if p.exists():
        for line in p.open():
            try:
                r = json.loads(line)
            except ValueError:
                continue
            if r.get('行'):
                done.add(r['窗'])
    return len(done)


def main():
    all_done, left = True, 0
    for ep in PILOT + FULL:
        name = '试点' if ep in PILOT else '全量'
        t, d = total_windows(ep), done_windows(ep, name)
        left += t - d
        all_done &= d >= t
        print(f'{ep} {name} {d}/{t}')
    print(f'合计待跑 {left} 窗')
    sys.exit(0 if all_done else 1)


if __name__ == '__main__':
    main()

"""指代盲标出题分批（单集）。用法：
  python deixis_batches.py P01                 正式输出到 指代层/试点/盲标/
  python deixis_batches.py P17 --out <临时目录>  自测：全部输出改写到临时目录，正式目录一个文件都不动

照试点（P17 + P05，11-09 临时写的两段 python）原逻辑重建，只是改成按集出、批名带集号：
- 读 指代层/试点/<集>/题目清单.json，只取有停顿帧的题（无停顿帧的不出题，与 pilot_deixis.py 一致）；
- 每题写一份去掉程序线索的 标注题.json（只留 题号/词/上下文/说出秒/说出帧；去掉 停顿帧指尖坐标、_指尖格、板面帧、A整帧），
  位置同试点：指代层/试点/<集>/题/<题号>/标注题.json（--out 时改写到 <out>/<集>/题/<题号>/标注题.json）；
- 另存整集一份 盲标/标注题-<集>.json（同样五个字段，供核对 / 计分用，帮手不用读）；
- 每批 10 题，写 盲标/批/批<集>-NN.txt（NN 两位数从 01 起），格式与试点 批01.txt 完全相同：
    【题号】 <标注题.json 绝对路径>
      <A/ 下全部 jpg 绝对路径，按文件名排序>
      <B/ 下全部 jpg 绝对路径，按文件名排序>
  帮手只能 Read、不能列目录，所以图片全部列出绝对路径。
- 帮手结果写 盲标/结果/批<集>-NN.json；join_sentences.py 的 glob「盲标/结果/批*.json」能读到。
已有本集批清单就停止，不覆盖（批的划分一旦派出去，结果文件名就跟它绑定）；--force 才覆盖。
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = ROOT / '指代层' / '试点'
KEEP = ['题号', '词', '上下文', '说出秒', '说出帧']
SIZE = 10


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ep')
    ap.add_argument('--out', help='自测用：把盲标目录和每题 标注题.json 都改写到这个目录')
    ap.add_argument('--force', action='store_true', help='本集批清单已存在时仍覆盖')
    a = ap.parse_args()
    ep = a.ep

    src = BASE / ep / '题目清单.json'
    if not src.exists():
        raise SystemExit(f'{src} 不存在：先跑 pilot_deixis.py 出题 {ep}')
    if a.out:
        out = Path(a.out).resolve()
        ann_root = out / ep / '题'
    else:
        out = BASE / '盲标'
        ann_root = BASE / ep / '题'
    bdir = out / '批'
    old = sorted(bdir.glob(f'批{ep}-*.txt')) if bdir.exists() else []
    if old and not a.force:
        raise SystemExit(f'{bdir} 已有 {len(old)} 个 批{ep}-*.txt，不覆盖（要重出加 --force，并先确认 结果/ 里没有对应的批结果）')
    done = [f.name for f in sorted((out / '结果').glob('*.json'))
            if any(str(x.get('题号', '')).startswith(f'{ep}-') for x in json.loads(f.read_text()))] if (out / '结果').exists() else []
    if done and not a.force:      # 试点 P17 / P05 已在 批01–30 标完，防止误重出
        raise SystemExit(f'{ep} 已有盲标结果（{", ".join(done[:3])}{" …" if len(done) > 3 else ""}），不重出；确要重出加 --force')

    qs = [q for q in json.loads(src.read_text()) if q['停顿帧']]
    if not qs:
        raise SystemExit(f'{ep} 没有可出的题（全部无停顿帧）')
    bdir.mkdir(parents=True, exist_ok=True)
    (out / '结果').mkdir(parents=True, exist_ok=True)

    anns, missing = [], []
    for q in qs:
        ann = {k: q[k] for k in KEEP}
        anns.append(ann)
        d = ann_root / q['题号']
        d.mkdir(parents=True, exist_ok=True)
        (d / '标注题.json').write_text(json.dumps(ann, ensure_ascii=False, indent=1) + '\n')
    (out / f'标注题-{ep}.json').write_text(json.dumps(anns, ensure_ascii=False, indent=1) + '\n')

    n = 0
    for i in range(0, len(qs), SIZE):
        n += 1
        lines = []
        for q in qs[i:i + SIZE]:
            qid = q['题号']
            img = BASE / ep / '题' / qid
            lines.append(f'【{qid}】 {ann_root / qid / "标注题.json"}')
            got = 0
            for sub in ['A', 'B']:
                for f in sorted((img / sub).glob('*.jpg')):
                    lines.append(f'  {f}')
                    got += 1
            if got == 0:
                missing.append(qid)
        (bdir / f'批{ep}-{n:02d}.txt').write_text('\n'.join(lines) + '\n')
    for f in old:          # --force 时清掉编号超出本次批数的旧批
        if int(f.stem.rsplit('-', 1)[1]) > n:
            f.unlink()

    print(ep, '题数', len(qs), '批数', n, f'批{ep}-01.txt … 批{ep}-{n:02d}.txt →', bdir)
    print('帮手结果写', out / '结果' / f'批{ep}-NN.json')
    if missing:
        print('警告：这些题没有图片（题目录缺 A/B）：', ' '.join(missing), file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()

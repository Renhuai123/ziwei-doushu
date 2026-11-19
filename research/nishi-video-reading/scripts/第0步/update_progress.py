"""把全量（第 9 步）与交付（第 10 步）的实时进度写进 整体进度流程图.html。
用法（在 第0步/ 下）：python update_progress.py        改写页面；第 9、10 步都 100% 时退出码 0，否则 1
                     python update_progress.py --只看  只打印数字，不改页面

只读磁盘上的真实文件，不调任何接口；算不出就写「待开始 / 数据未就绪」。
公开版说明：原版还从逐帧日志推算 DeepSeek 账户金额写进页面，公开版去掉了。
页面里的标记区：<!--进度9-开始-->…<!--进度9-结束-->、<!--进度10-开始-->…<!--进度10-结束-->、<!--徽标9/10-开始-->…<!--徽标9/10-结束-->；
缺了就插在第 9 / 10 步卡片标题下方（幂等，可反复跑）。写页面用「写临时文件再改名」，开着的页面不会读到半截。

第 9 步 = 四项平均：
  ① DeepSeek 逐帧层：复用 full_status.py 的计数（17 集含试点，已完成窗 / 总窗）
  ② 本机预处理（15 集）：苹果字幕轨、逐字语音、姿态上下、指代出题四样都齐才算 1 集
  ③ 指代层 Claude 盲标：每集 已写结果的批 / 已生成的批，未出题的集算 0，15 集平均（试点 批01–30 不算）
  ④ 康奈尔笔记出稿：DeepSeek 私仓 康奈尔笔记/<集>/<集>-康奈尔笔记.html 存在的集数 / 17
第 10 步 = 全量配置/交付里程碑.json 已完成项 / 总项；「自动」项按私仓 git 已提交的笔记集数算。
"""
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent            # 第0步
BASE = ROOT.parent
PAGE = BASE / '整体进度流程图.html'
CFG = ROOT / '全量配置'
MILESTONES = CFG / '交付里程碑.json'
HISTORY = CFG / '进度历史.jsonl'
NOTES_REPO = BASE / '笔记仓库' / 'nishi-ziwei-notes-deepseek'
BLIND = ROOT / '指代层' / '试点' / '盲标'
PREP_LOG = ROOT / '日志' / '预处理-全量.log'
REFRESH_NOTE = '每小时自动刷新'

sys.path.insert(0, str(ROOT))
import full_status as fs  # noqa: E402  只用它的计数函数和集名单

PILOT, FULL = fs.PILOT, fs.FULL
ALL = PILOT + FULL
NOW = datetime.now()


# ---------- 小工具 ----------
def esc(s):
    return html.escape(str(s), quote=False)


def pct_text(p):
    """向下取整，免得没做完显示 100%；有进展但不到 1% 显示 <1%。"""
    if p is None:
        return '—'
    if 0 < p < 0.01:
        return '&lt;1%'
    return f'{int(p * 100 + 1e-9)}%'


def last_line(path, block=65536):
    with open(path, 'rb') as fh:
        fh.seek(0, os.SEEK_END)
        size = fh.tell()
        fh.seek(max(0, size - block))
        lines = [l for l in fh.read().splitlines() if l.strip()]
    return lines[-1].decode('utf-8', 'replace') if lines else None


def first_line(path):
    with open(path, 'rb') as fh:
        return fh.readline().decode('utf-8', 'replace')


def jline(s):
    try:
        return json.loads(s) if s else None
    except ValueError:
        return None


def max_frame(ep):
    n = -1
    for line in open(BASE / '全帧-20261107' / '清单' / f'{ep}.tsv'):
        n = max(n, int(line.split('\t', 1)[0]))
    return n


def write_atomic(path, text):
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix='.' + path.name + '.', suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as fh:
            fh.write(text)
        os.chmod(tmp, 0o644)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def eps_text(eps):
    return '、'.join(eps)


# ---------- ① 逐帧层 ----------
def frames_layer():
    rows = []
    for ep in ALL:
        name = '试点' if ep in PILOT else '全量'
        t, d = fs.total_windows(ep), fs.done_windows(ep, name)
        rows.append((ep, min(d, t), t))
    done, total = sum(r[1] for r in rows), sum(r[2] for r in rows)
    return {'行': rows, '完成': done, '总': total, '比例': done / total if total else None}


def eta(done, total):
    """按进度历史里最近一段（≥20 分钟、尽量 3 小时内）的实际速度推算跑完时间。"""
    try:
        hist = [json.loads(l) for l in HISTORY.open() if l.strip()]
    except (OSError, ValueError):
        return None
    pts = [(datetime.fromisoformat(h['时间']), h['已完成窗']) for h in hist if h.get('总窗') == total]
    old = [p for p in pts if NOW - p[0] >= timedelta(minutes=20)]
    if not old:
        return None
    pool = [p for p in old if NOW - p[0] <= timedelta(hours=3)] or [max(old, key=lambda p: p[0])]
    t0, d0 = min(pool, key=lambda p: p[0])
    hours = (NOW - t0).total_seconds() / 3600
    rate = (done - d0) / hours
    return {'速度': rate, '小时': hours, '预计': NOW + timedelta(hours=(total - done) / rate) if rate > 0 else None}


def append_history(fr):
    CFG.mkdir(exist_ok=True)
    with HISTORY.open('a') as fh:
        fh.write(json.dumps({'时间': NOW.isoformat(timespec='seconds'), '已完成窗': fr['完成'], '总窗': fr['总']},
                            ensure_ascii=False) + '\n')


# ---------- ② 本机预处理 ----------
def prep_layer():
    logged = set()
    if PREP_LOG.exists():
        logged = set(re.findall(r'预处理完成\s*(P\d{2})', PREP_LOG.read_text(encoding='utf-8', errors='replace')))
    per = {}
    for ep in FULL:
        apple = BASE / '字幕' / '苹果识别' / f'{ep}.jsonl'
        # subtitle_clean.py 逐行写这个文件：末行能解析、且 1 分钟没再改动才算齐（防读到正在写的半截）
        a_ok = (apple.exists() and time.time() - apple.stat().st_mtime >= 60
                and (jline(last_line(apple)) or {}).get('止帧') is not None)
        speech = BASE / '字幕' / '语音' / f'{ep}-字词.json'
        s_ok = False
        if speech.exists():
            try:
                s_ok = bool(json.loads(speech.read_text(encoding='utf-8')).get('transcription'))
            except (ValueError, UnicodeDecodeError):
                s_ok = False
        up, dn = ROOT / '姿态' / f'{ep}-上.jsonl', ROOT / '姿态' / f'{ep}-下.jsonl'
        p_ok = False
        if up.exists() and dn.exists():
            u0, u1 = jline(first_line(up)), jline(last_line(up))
            d0, d1 = jline(first_line(dn)), jline(last_line(dn))
            if u0 and u1 and d0 and d1:
                p_ok = u0.get('f') == 0 and u1['f'] + 1 >= d0['f'] and d1['f'] >= max_frame(ep)
        q = ROOT / '指代层' / '试点' / ep / '题目清单.json'
        q_ok = False
        if q.exists():
            try:
                q_ok = isinstance(json.loads(q.read_text(encoding='utf-8')), list)
            except (ValueError, UnicodeDecodeError):
                q_ok = False
        per[ep] = {'苹果字幕轨': a_ok, '逐字语音': s_ok, '姿态': p_ok, '指代出题': q_ok}
    full = [ep for ep in FULL if all(per[ep].values())]
    each = {k: sum(per[ep][k] for ep in FULL) for k in ('苹果字幕轨', '逐字语音', '姿态', '指代出题')}
    return {'齐': full, '各样': each, '日志确认': sorted(logged & set(FULL)), '总': len(FULL),
            '比例': len(full) / len(FULL)}


# ---------- ③ 指代层盲标 ----------
def blind_layer():
    pat = re.compile(r'^批(P\d{2})-(\d+)\.txt$')
    gen = {}
    for d in (BLIND, BLIND / '批'):
        if d.is_dir():
            for p in d.iterdir():
                m = pat.match(p.name)
                if m and m.group(1) in FULL:
                    gen.setdefault(m.group(1), set()).add(m.group(2))
    res = {}
    for ep, nums in gen.items():
        for nn in nums:
            r = BLIND / '结果' / f'批{ep}-{nn}.json'
            if r.exists():
                try:
                    json.loads(r.read_text(encoding='utf-8'))
                except (ValueError, UnicodeDecodeError):
                    continue
                res.setdefault(ep, set()).add(nn)
    fracs = {ep: (len(res.get(ep, ())) / len(gen[ep]) if gen.get(ep) else 0.0) for ep in FULL}
    return {'出题集': sorted(gen), '标完集': [ep for ep in FULL if gen.get(ep) and fracs[ep] >= 1],
            '已标批': sum(len(v) for v in res.values()), '已生成批': sum(len(v) for v in gen.values()),
            '总': len(FULL), '比例': sum(fracs.values()) / len(FULL)}


# ---------- ④ 康奈尔笔记 ----------
def note_path(ep):
    return f'康奈尔笔记/{ep}/{ep}-康奈尔笔记.html'


def notes_layer():
    have = [ep for ep in ALL if (NOTES_REPO / note_path(ep)).exists()]
    return {'有': have, '总': len(ALL), '比例': len(have) / len(ALL)}


# ---------- 第 10 步 ----------
def committed_notes():
    try:
        out = subprocess.run(['git', '-C', str(NOTES_REPO), '-c', 'core.quotepath=off', 'ls-tree', '-r', '--name-only',
                              'HEAD', '--', '康奈尔笔记'], capture_output=True, text=True, timeout=30, check=True).stdout
    except (OSError, subprocess.SubprocessError):
        return None
    files = set(out.splitlines())
    return [ep for ep in ALL if note_path(ep) in files]


def last_commit_time(eps):
    try:
        out = subprocess.run(['git', '-C', str(NOTES_REPO), 'log', '-1', '--format=%cd', '--date=format:%Y-%m-%d %H:%M',
                              '--'] + [note_path(ep) for ep in eps], capture_output=True, text=True, timeout=30).stdout
        return out.strip() or None
    except (OSError, subprocess.SubprocessError):
        return None


def delivery():
    try:
        items = json.loads(MILESTONES.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return None
    changed = False
    for it in items:
        if it.get('自动') == 'DeepSeek私仓17集':
            c = committed_notes()
            it['_子'] = (len(c), len(ALL)) if c is not None else None
            ok = c is not None and len(c) >= len(ALL)
            if ok and not it.get('完成'):
                it['完成'], it['完成时间'] = True, last_commit_time(c) or NOW.strftime('%Y-%m-%d %H:%M')
                changed = True
    if changed:   # 自动项满了就写回 JSON，让文件和页面一致
        write_atomic(MILESTONES, json.dumps([{k: v for k, v in it.items() if not k.startswith('_')} for it in items],
                                            ensure_ascii=False, indent=1) + '\n')
    done = sum(bool(it.get('完成')) for it in items)
    return {'项': items, '完成': done, '总': len(items), '比例': done / len(items) if items else None}


# ---------- 渲染 ----------
def bar(p, small=False):
    cls = 'bar' + (' sm' if small else '') + (' ok' if p is not None and p >= 1 else '')
    w = 0 if p is None else max(0.0, min(1.0, p)) * 100
    return f'<div class="{cls}"><i style="width:{w:.1f}%"></i></div>'


def item(name, right, p, note):
    return (f'<div class="pi"><div class="barlab"><span>{name}</span><span>{right}</span></div>'
            f'{bar(p, True)}<p>{note}</p></div>')


def status(p, started):
    if p is not None and p >= 1:
        return 'done', '<span class="chip c-done">已完成</span>'
    if started:
        return 'run', '<span class="chip c-run">进行中</span>'
    return '', '<span class="chip c-todo">未开始</span>'


def render9(fr, pr, bl, nt):
    # ①
    rows = fr['行']
    fin = [r[0] for r in rows if r[1] >= r[2]]
    part = [f'{r[0]} 差 {r[2] - r[1]:,} 窗' for r in rows if 0 < r[1] < r[2]]   # 写明差几窗：只差零星失败窗的集一眼看得出
    zero = [r[0] for r in rows if r[1] == 0]
    n1 = f'17 集：跑完 {len(fin)} 集'
    if part:
        n1 += f'，跑了一部分 {len(part)} 集（{eps_text(part)}）'
    if zero:
        n1 += f'，未开始 {len(zero)} 集'
    n1 += '。'
    if fr['完成'] >= fr['总']:
        n1 += '已全部跑完。'
    else:
        e = eta(fr['完成'], fr['总'])
        if e and e['预计']:
            when = e['预计']
            day = '今天' if when.date() == NOW.date() else ('明天' if when.date() == NOW.date() + timedelta(days=1)
                                                          else when.strftime('%m-%d'))
            n1 += (f'按最近 {e["小时"]:.1f} 小时实际速度（每小时约 {int(e["速度"]):,} 窗）推算，'
                   f'约{day} {when:%H:%M} 跑完。')
        elif e:
            n1 += f'最近 {e["小时"]:.1f} 小时没有新完成的窗。'
        else:
            n1 += '推算完成时间：再采一次数后给出。'
    i1 = item('① DeepSeek 逐帧层', f'{fr["完成"]:,} / {fr["总"]:,} 窗 · {pct_text(fr["比例"])}', fr['比例'], n1)
    # ②
    ea = pr['各样']
    n2 = (f'四样都齐才算 1 集。各样已齐：苹果字幕轨 {ea["苹果字幕轨"]}、逐字语音 {ea["逐字语音"]}、'
          f'姿态 {ea["姿态"]}、指代出题 {ea["指代出题"]} 集')
    n2 += f'；日志记「预处理完成」{len(pr["日志确认"])} 集。' if PREP_LOG.exists() else '；预处理日志还没生成。'
    if not any(ea.values()):
        n2 = '待开始（15 集四样都还没出）。' + n2
    i2 = item('② 本机预处理', f'{len(pr["齐"])} / {pr["总"]} 集 · {pct_text(pr["比例"])}', pr['比例'], n2)
    # ③
    if bl['已生成批']:
        n3 = (f'已出题 {len(bl["出题集"])} / 15 集，已标 {bl["已标批"]} / {bl["已生成批"]} 批，'
              f'标完 {len(bl["标完集"])} 集；按集平均，未出题的集算 0。')
    else:
        n3 = '待出题：15 集都还没生成批清单（按集平均，未出题的集算 0）。'
    i3 = item('③ 指代层（Claude 看原帧盲标）', f'{len(bl["标完集"])} / {bl["总"]} 集 · {pct_text(bl["比例"])}',
              bl['比例'], n3)
    # ④
    rest = [ep for ep in ALL if ep not in nt['有']]
    n4 = f'已出稿：{eps_text(nt["有"]) or "无"}。' + (f'还差 {len(rest)} 集。' if rest else '17 集全部出稿。')
    i4 = item('④ 康奈尔笔记出稿', f'{len(nt["有"])} / {nt["总"]} 集 · {pct_text(nt["比例"])}', nt['比例'], n4)

    ps = [fr['比例'], pr['比例'], bl['比例'], nt['比例']]
    total = None if any(p is None for p in ps) else sum(ps) / 4
    head = (f'<div class="prog-head"><span>总进度（四项平均）</span><b>{pct_text(total)}</b></div>'
            if total is not None else '<div class="prog-head"><span>总进度（四项平均）</span><b>数据未就绪</b></div>')
    body = (f'<div class="prog">{head}{bar(total)}<div class="prog-items">{i1}{i2}{i3}{i4}</div>'
            f'<p class="prog-time">更新于 {NOW:%H:%M}（{REFRESH_NOTE}）</p></div>')
    started = any((p or 0) > 0 for p in ps)
    return body, total, status(total, started)


def render10(dv):
    if dv is None:
        body = ('<div class="prog"><div class="prog-head"><span>总进度（按里程碑）</span><b>数据未就绪</b></div>'
                f'{bar(None)}<p class="prog-time">更新于 {NOW:%H:%M}（{REFRESH_NOTE}）：读不到 第0步/全量配置/交付里程碑.json</p></div>')
        return body, None, status(None, False)
    lis = []
    partial = False
    for it in dv['项']:
        ok = bool(it.get('完成'))
        extra = ''
        if it.get('_子'):
            a, b = it['_子']
            partial |= a > 0
            extra = f'{bar(a / b, True)}<span class="sub-n">已提交 {a} / {b} 集</span>'
        elif it.get('自动'):
            extra = '<span class="sub-n">数据未就绪</span>'
        when = f'<span class="sub-n">{esc(it["完成时间"])}</span>' if ok and it.get('完成时间') else ''
        lis.append(f'<li class="{"ok" if ok else ""}"><span class="mk"></span><span>{esc(it.get("名称", ""))}</span>{extra}{when}</li>')
    p = dv['比例']
    body = (f'<div class="prog"><div class="prog-head"><span>总进度（按里程碑，共 {dv["总"]} 项）</span>'
            f'<b>{dv["完成"]} / {dv["总"]} · {pct_text(p)}</b></div>{bar(p)}<ul class="ms">{"".join(lis)}</ul>'
            f'<p class="prog-time">更新于 {NOW:%H:%M}（{REFRESH_NOTE}）</p></div>')
    return body, p, status(p, dv['完成'] > 0 or partial)


# ---------- 写进页面 ----------
def section_span(page, n):
    m = re.search(r'<section class="step[^"]*">\s*<div class="dot">' + str(n) + r'</div>', page)
    if not m:
        raise SystemExit(f'页面里找不到第 {n} 步卡片，没改页面')
    end = page.find('</section>', m.end())
    return m.start(), end


def patch(page, n, block, chip, cls):
    s, e = section_span(page, n)
    sec = page[s:e]
    # 状态徽标：标题旁第一枚 chip 包进标记
    bs, be = f'<!--徽标{n}-开始-->', f'<!--徽标{n}-结束-->'
    if bs in sec:
        sec = re.sub(re.escape(bs) + '.*?' + re.escape(be), lambda m: bs + chip + be, sec, count=1, flags=re.S)
    else:
        sec, k = re.subn(r'(<div class="head">.*?</h2>)\s*<span class="chip[^"]*">[^<]*</span>',
                         lambda m: m.group(1) + bs + chip + be, sec, count=1, flags=re.S)
        if not k:
            sec = re.sub(r'(<div class="head">.*?</h2>)', lambda m: m.group(1) + bs + chip + be, sec, count=1, flags=re.S)
    # 进度区：插在标题行下方
    ps, pe = f'<!--进度{n}-开始-->', f'<!--进度{n}-结束-->'
    if ps in sec:
        sec = re.sub(re.escape(ps) + '.*?' + re.escape(pe), lambda m: ps + block + pe, sec, count=1, flags=re.S)
    else:
        hs = sec.find('<div class="head">')
        he = sec.find('</div>', hs) + len('</div>')
        sec = sec[:he] + '\n        ' + ps + block + pe + sec[he:]
    # 卡片样式随状态
    sec = re.sub(r'^<section class="step[^"]*">', f'<section class="step{" " + cls if cls else ""}">', sec, count=1)
    return page[:s] + sec + page[e:]


def main():
    only_look = '--只看' in sys.argv
    fr, pr, bl, nt = frames_layer(), prep_layer(), blind_layer(), notes_layer()
    dv = delivery()
    b9, p9, (c9, chip9) = render9(fr, pr, bl, nt)
    b10, p10, (c10, chip10) = render10(dv)
    print(f'{NOW:%m-%d %H:%M} 第9步 {pct_text(p9)}：逐帧 {fr["完成"]}/{fr["总"]} 窗，预处理 {len(pr["齐"])}/15 集，'
          f'盲标 {bl["已标批"]}/{bl["已生成批"]} 批（{pct_text(bl["比例"])}），笔记 {len(nt["有"])}/17；'
          f'第10步 {pct_text(p10)}（{dv["完成"] if dv else "?"}/{dv["总"] if dv else "?"}）')
    if only_look:
        return
    append_history(fr)
    page = PAGE.read_text(encoding='utf-8')
    new = patch(page, 9, b9, chip9, c9)
    new = patch(new, 10, b10, chip10, c10)
    if '<meta http-equiv="refresh"' not in new:
        new = new.replace('<meta name="viewport"', '<meta http-equiv="refresh" content="300">\n<meta name="viewport"', 1)
    if new != page:
        write_atomic(PAGE, new)
    sys.exit(0 if (p9 or 0) >= 1 and (p10 or 0) >= 1 else 1)


if __name__ == '__main__':
    main()

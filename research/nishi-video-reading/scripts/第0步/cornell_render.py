#!/usr/bin/env python3
"""校验各块康奈尔笔记稿，再拼成整集网页和 md。不调任何接口。

校验（全部由程序对着现成数据核，不靠模型自述）：
  1. 结构：键齐全、标签五选一、帧号落在本块范围内
  2. 引文：〔口述〕里「」中的每一段，去掉标点后要在所引帧附近的字幕里原字找到；
     找不到再看是不是只差一两个字（同音改字）、是不是只在语音里、是不是帧号标偏了
  3. 板书：帧号必须是本块板书图清单里的某一张
  4. 指代：所引帧附近必须有一道盲标为「是指代 + 确定」的题
  5. 叠图：文字里提到的星曜、宫名，那段时间的叠图里得真有
  6. 漏讲：本块里超过 45 秒没被任何条目盖到的时间段，连字幕列出来

用法（在 第0步/ 下，先跑过 join_sentences.py、cornell_blocks.py，且各块 JSON 已写好）：
  ../.venv-vision/bin/python cornell_render.py P17 --check     只校验
  ../.venv-vision/bin/python cornell_render.py P17             校验 + 出网页和 md
输出：
  按句拼接/试点/P17-笔记块/校验报告.json
  ../康奈尔样稿/P17-整集第一稿.html、.md
"""
import difflib
import html
import json
import os
import re
import sys
from collections import Counter, defaultdict

from join_sentences import FPS, load_overlay, merge_config, tc

BV = "BV1KJsLekEfA"
# p = B 站合辑分 P 号（= 集号数字）；标题取自 审计/BV1KJsLekEfA-view.json 的分 P 标题。
# 试点两集写在代码里；其余各集写进 第0步/全量配置/EP_INFO.json（以后每集只往 json 里加一条）。
EP_INFO = {
    "P17": {"p": 17, "标题": "9 上：再婚改运法 / 挑子女时间 / 中年丧偶面相 / 化忌冲命"},
    "P05": {"p": 5, "标题": "3 上：四化星 / 北斗星系 / 南斗星系"},
}
EP_INFO = merge_config(EP_INFO, "EP_INFO")
TAGS = {"口述": "t-say", "叠图": "t-ov", "板书": "t-chalk", "指代": "t-point", "推断": "t-infer"}
MARGIN = 600       # 条目帧号允许越出本块多少帧（前后文各约 20 秒）
NEAR = 450         # 引文在所引帧范围前后多少帧内找
GAP_SEC = 45       # 多长没被盖到算空档
MAIN = ["紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军"]
AUX = ["左辅", "右弼", "文昌", "文曲", "天魁", "天钺", "禄存", "天马", "擎羊", "陀罗", "火星", "铃星", "地空", "地劫"]
GRID = {"巳": (1, 1), "午": (1, 2), "未": (1, 3), "申": (1, 4), "辰": (2, 1), "酉": (2, 4),
        "卯": (3, 1), "戌": (3, 4), "寅": (4, 1), "丑": (4, 2), "子": (4, 3), "亥": (4, 4)}
STAR_RE = re.compile(r"(.{2,}?)([庙旺得利平不陷])([禄权科忌]?)")
FRAME_RE = re.compile(r"第\s*(\d+)\s*(?:[–—\-~～至到]\s*(\d+)\s*)?帧")


# ───────────────────────── 读数据 ─────────────────────────

def load(ep):
    # 「按句拼接/试点/」是 join_sentences / cornell_blocks 的输出目录，17 集（含全量 15 集）都在这里，不是只给试点用
    base = f"按句拼接/试点/{ep}-笔记块"
    blocks = json.load(open(f"{base}/分块.json"))
    rows = [json.loads(l) for l in open(f"按句拼接/试点/{ep}.jsonl")]
    notes = {}
    for b in blocks:
        p = f"{base}/块{b['块']}.json"
        notes[b["块"]] = json.load(open(p)) if os.path.exists(p) else None
    return base, blocks, rows, notes, load_overlay(ep)


T2S = str.maketrans("決將", "决将")   # 字幕里零星的繁体字；只为比对，不改笔记和字幕


def norm(s):
    return "".join(ch for ch in (s or "") if ch.isalnum()).translate(T2S)


def hay(rows, a, b, field):
    return "".join(norm(r[field]) for r in rows if r["管到帧"] >= a and r["起帧"] <= b)


def best_window(seg, h):
    best = (0.0, "")
    sm = difflib.SequenceMatcher(None, "", seg, autojunk=False)
    for w in (len(seg), len(seg) - 1, len(seg) + 1, len(seg) + 2):
        if w < 2 or w > len(h):
            continue
        for i in range(len(h) - w + 1):
            sm.set_seq1(h[i:i + w])
            if sm.quick_ratio() <= best[0]:
                continue
            r = sm.ratio()
            if r > best[0]:
                best = (r, h[i:i + w])
    return best


def where(seg, rows):
    """整块里原字找到的话，落在哪一句。"""
    acc, spans = "", []
    for r in rows:
        s = norm(r["字幕"])
        spans.append((len(acc), len(acc) + len(s), r))
        acc += s
    i = acc.find(seg)
    if i < 0:
        return None
    return next(r for a, b, r in spans if a <= i < b)


def star_name(s):
    m = STAR_RE.fullmatch(s)
    return m.group(1) if m else s


# ───────────────────────── 校验 ─────────────────────────

def check(ep, blocks, rows, notes, overlay):
    report = {"块": {}, "问题": []}
    prob = report["问题"]
    deixis = [(d["说出帧"], d) for r in rows for d in r["指代"]]
    vocab = set()
    for o in overlay:
        for k, v in o["格"].items():
            vocab.update({k[:-2], k[-2:]})
            vocab.update(star_name(x) for x in v if not re.fullmatch(r"[\d□]+", x))
    vocab = {v for v in vocab if len(v) >= 2 and not re.search(r"[\d□]", v)}

    for b in blocks:
        n, d = b["块"], notes[b["块"]]
        st = Counter()
        if d is None:
            prob.append((n, "结构", "还没有这一块的稿子"))
            continue
        for k in ("小标题", "行", "总结候选", "待核"):
            if k not in d:
                prob.append((n, "结构", f"缺键 {k}"))
        blk_rows = rows[b["句"][0]:b["句"][1]]
        board = {x["帧"] for x in b["板书图"]}
        cover = []
        for ri, row in enumerate(d.get("行", [])):
            if not row.get("提示") or not row.get("条目"):
                prob.append((n, "结构", f"第 {ri + 1} 行缺提示或条目"))
            if len(row.get("提示", "")) > 30:
                prob.append((n, "结构", f"第 {ri + 1} 行提示太长：{row['提示']}"))
            for it in row.get("条目", []):
                tag, text, a, e = it.get("标签"), it.get("文字", ""), it.get("起帧"), it.get("止帧")
                st["条"] += 1
                st[tag] += 1
                head = f"{tag}｜第 {a}–{e} 帧｜{text[:40]}"
                if tag not in TAGS:
                    prob.append((n, "结构", f"标签不认识：{head}"))
                if not isinstance(a, int) or not isinstance(e, int) or a > e:
                    prob.append((n, "结构", f"帧号不对：{head}"))
                    continue
                if a < b["起帧"] - MARGIN or e > b["止帧"] + MARGIN:
                    prob.append((n, "结构", f"帧号越出本块：{head}"))
                if '"' in text or re.search(r"\d\d:\d\d", text) or re.search(r"[A-Za-z]{4,}", text):
                    prob.append((n, "结构", f"文字里有英文引号 / 时间码 / 英文：{head}"))
                if tag != "板书":
                    cover.append((a, e))
                if tag == "口述":
                    for q in re.findall(r"「([^「」]*)」", text):
                        for seg in (norm(x) for x in re.split(r"…+", q)):
                            if len(seg) < 2:
                                continue
                            st["引文段"] += 1
                            h = hay(rows, a - NEAR, e + NEAR, "字幕")
                            if seg in h:
                                st["原字"] += 1
                                continue
                            r, cand = best_window(seg, h)
                            if r >= 0.8:
                                st["近似"] += 1
                                prob.append((n, "引文近似", f"「{seg}」≈ 字幕「{cand}」（第 {a}–{e} 帧）"))
                                continue
                            if seg in hay(rows, a - NEAR, e + NEAR, "语音"):
                                st["只在语音"] += 1
                                prob.append((n, "引文只在语音", f"「{seg}」（第 {a}–{e} 帧）"))
                                continue
                            w = where(seg, rows)
                            if w:
                                st["帧号偏"] += 1
                                prob.append((n, "引文帧号偏", f"「{seg}」标的是第 {a}–{e} 帧，实际在第 {w['起帧']}–{w['止帧']} 帧"))
                                continue
                            st["不中"] += 1
                            prob.append((n, "引文不中", f"「{seg}」最像「{cand}」{r:.2f}（第 {a}–{e} 帧）｜{text[:60]}"))
                elif tag == "板书":
                    if a not in board or a != e:
                        near = min(board, key=lambda f: abs(f - a))
                        prob.append((n, "板书帧不在清单", f"第 {a}–{e} 帧（最近的图是第 {near} 帧）｜{text[:40]}"))
                elif tag == "指代":
                    ok = [x for f, x in deixis if a - 90 <= f <= e + 90
                          and (x["盲标"] or {}).get("是指代") == "是" and (x["盲标"] or {}).get("把握") == "确定"]
                    if not ok:
                        got = [f"{x['词']}@{f}:{(x['盲标'] or {}).get('是指代')}/{(x['盲标'] or {}).get('把握')}"
                               for f, x in deixis if a - 300 <= f <= e + 300]
                        prob.append((n, "指代没依据", f"第 {a}–{e} 帧｜{text[:50]}｜附近的题：{got or '无'}"))
                elif tag == "叠图":
                    act = set()
                    hit = False
                    for o in overlay:
                        if o["起秒"] - 2 <= e / FPS and a / FPS <= o["止秒"] + 2:
                            hit = True
                            for k, v in o["格"].items():
                                act.update({k[:-2], k[-2:], k})
                                act.update(star_name(x) for x in v)
                    if not hit:
                        prob.append((n, "叠图那时没贴图", f"第 {a}–{e} 帧｜{text[:50]}"))
                    else:
                        miss = sorted(v for v in vocab if v in text and v not in act)
                        if miss:
                            prob.append((n, "叠图里没有这些字", f"{'、'.join(miss)}｜第 {a}–{e} 帧｜{text[:50]}"))
        # 漏讲
        cover.sort()
        cur, gaps = b["起帧"], []
        for a, e in cover:
            if a - cur > GAP_SEC * FPS:
                gaps.append((cur, a))
            cur = max(cur, e)
        if b["止帧"] - cur > GAP_SEC * FPS:
            gaps.append((cur, b["止帧"]))
        for a, e in gaps:
            said = " ".join(r["字幕"] for r in blk_rows if r["起帧"] >= a and r["止帧"] <= e)
            prob.append((n, "空档", f"{tc(a / FPS)}–{tc(e / FPS)}（第 {a}–{e} 帧，{(e - a) / FPS:.0f} 秒）：{said[:260]}"))
        for k, v in d.get("总结候选", {}).items():
            for s in v:
                if not FRAME_RE.search(s):
                    prob.append((n, "总结没标帧号", s[:60]))
        st["行"] = len(d.get("行", []))
        st["待核"] = len(d.get("待核", []))
        report["块"][n] = dict(st)
    return report


def print_report(report):
    tot = Counter()
    for n, st in report["块"].items():
        tot.update(st)
        print(f"块{n}：{st.get('行', 0)} 行 {st.get('条', 0)} 条｜口述 {st.get('口述', 0)} 叠图 {st.get('叠图', 0)} "
              f"板书 {st.get('板书', 0)} 指代 {st.get('指代', 0)} 推断 {st.get('推断', 0)}｜引文 {st.get('引文段', 0)} 段："
              f"原字 {st.get('原字', 0)} 近似 {st.get('近似', 0)} 只在语音 {st.get('只在语音', 0)} "
              f"帧号偏 {st.get('帧号偏', 0)} 不中 {st.get('不中', 0)}")
    q = tot["引文段"] or 1
    rest = tot["引文段"] - tot["原字"]
    print(f"合计：{tot['行']} 行 {tot['条']} 条，引文 {tot['引文段']} 段，原字 {tot['原字']}（{tot['原字'] / q:.1%}），"
          f"近似 {tot['近似']}，只在语音 {tot['只在语音']}，帧号偏 {tot['帧号偏']}，不中 {tot['不中']}；待核 {tot['待核']} 条")
    kinds = Counter(k for _, k, _ in report["问题"])
    print("问题分类：", dict(kinds))
    return tot


# ───────────────────────── 命盘重排 ─────────────────────────

def parse_cell(items):
    main, aux, misc, shen = [], [], [], False
    for x in dict.fromkeys(items):
        if x == "身宫":
            shen = True
            continue
        m = STAR_RE.fullmatch(x)
        if not m or re.search(r"[\d□]", x):
            continue
        name = m.group(1)
        (main if name in MAIN else aux if name in AUX else misc).append(m.groups())
    main.sort(key=lambda s: MAIN.index(s[0]))
    aux.sort(key=lambda s: AUX.index(s[0]))
    return main, aux, misc, shen


def chart_cells(overlay, a, b):
    """这个命例时间段里每个地支格的写法：每个宫名取最常见的那种写法（优先不带 □ 的）。
    11-13 P29 补检加了三条，只处理剪辑把一格原样贴到别的宫位上演示的情况（P29 例一续把命宫那一格
    贴到父母、兄弟两格上演示，例三把夫妻那一格贴成「命宫」演示）。原先演示格不带 □、真格的岁数串常带 □，
    演示就盖过了真格；同一地支两个宫名时后出现的直接覆盖前面的，例三的盘名因此错用了演示格的宫名。
      1. 宫名带 □ 的（如「疾厄□子」）并进同地支唯一对得上的不带 □ 的宫名；
      2. 同一地支有几个宫名时，去掉「这个宫名贴得最久的是别的地支」的那个（演示借名），其余照旧取后出现的；
      3. 一个宫名下有几种主星辅星组合时，去掉「这个组合贴得最久的是别的地支」的（从别格搬来的演示），
         剩下的先取星名里没有 □ 的组合，再取贴出秒数最多的组合（例三有一格的化忌，识别时一半落在一颗星、
         一半落在另一颗星，按条数会选错；对照视频原帧，按秒数选对）；
      4. 选定组合里照旧取最常见、优先整串不带 □ 的那一串出图。
    每个宫名只有一种主辅星组合、每个地支只有一个宫名时，结果与原先相同；其余各集若重新渲染，
    命盘格会有变动（见私有终检记录「11-13 P29 补检」），重渲前要逐格核。"""
    secs = defaultdict(lambda: defaultdict(Counter))    # 地支 → 宫名干支 → {整串: 秒数}
    cnt = defaultdict(lambda: defaultdict(Counter))     # 同上，按条数
    for o in overlay:
        if a <= o["起秒"] < b:
            dur = o["止秒"] - o["起秒"] + 1
            for k, v in o["格"].items():
                secs[k[-1]][k][tuple(v)] += dur
                cnt[k[-1]][k][tuple(v)] += 1

    def sig_of(t):
        main, aux, _, _ = parse_cell(t)
        return tuple(main + aux)

    def partial(t):   # 星名里有认不出的字（岁数串里的 □ 不算）
        return any("□" in x and re.search(r"[\u4e00-\u9fff]", x) for x in t)

    alias = {}
    sig_secs, name_secs = defaultdict(Counter), defaultdict(Counter)
    for z, keys in secs.items():
        clean_keys = [k for k in keys if "□" not in k]
        for k, c in keys.items():
            hit = [x for x in clean_keys if len(x) == len(k) and re.fullmatch(re.escape(k).replace("□", "."), x)] \
                if "□" in k else [k]
            alias[z, k] = hit[0] if len(hit) == 1 else k
            for t, s in c.items():
                if sig_of(t):
                    sig_secs[sig_of(t)][z] += s
            if "□" not in alias[z, k][:-2]:
                name_secs[alias[z, k][:-2]][z] += sum(c.values())
    sig_home = {s: c.most_common(1)[0][0] for s, c in sig_secs.items()}
    name_home = {n: c.most_common(1)[0][0] for n, c in name_secs.items()}

    cells = {}
    for z, keys in secs.items():
        names = list(dict.fromkeys(alias[z, k] for k in keys))
        names = [k for k in names if name_home.get(k[:-2], z) == z] or names
        best = names[-1]
        pool_s, pool_n = Counter(), Counter()
        for k in keys:
            if alias[z, k] == best:
                pool_s.update(secs[z][k])
                pool_n.update(cnt[z][k])
        by_sig = defaultdict(list)
        for t in pool_n:
            by_sig[sig_of(t)].append(t)
        sig = max(by_sig, key=lambda g: (not g or sig_home[g] == z,
                                         any(not partial(t) for t in by_sig[g]),
                                         sum(pool_s[t] for t in by_sig[g])))
        c = Counter({t: pool_n[t] for t in by_sig[sig]})
        clean = Counter({t: m for t, m in c.items() if not any("□" in x for x in t)}) or c
        main, aux, misc, shen = parse_cell(clean.most_common(1)[0][0])
        cells[z] = {"宫": best[:-2], "干支": best[-2:], "主": main, "辅": aux, "杂": misc, "身": shen,
                    "次数": sum(cnt[z][k][t] for k in keys if alias[z, k] == best for t in cnt[z][k])}
    return cells


def star_html(s):
    name, br, hua = s
    return f"{name}<i>{br}</i>" + (f"<em>{hua}</em>" if hua else "")


def chart_html(cells, title):
    out = ['<div class="chart">']
    for z, (r, c) in GRID.items():
        x = cells.get(z)
        if not x:
            out.append(f'<div class="cell none" style="grid-area:{r}/{c}"><div class="misc">视频里没贴过这一格</div>'
                       f'<div class="pal"><span></span><span>{z}</span></div></div>')
            continue
        parts = []
        if x["主"]:
            parts.append('<div class="main">' + " ".join(star_html(s) for s in x["主"]) + "</div>")
        if x["辅"]:
            parts.append('<div class="aux">' + " ".join(star_html(s) for s in x["辅"]) + "</div>")
        if x["杂"]:
            parts.append('<div class="misc">' + " ".join(star_html(s) for s in x["杂"]) + "</div>")
        shen = '<b class="shen">身</b>' if x["身"] else ""
        out.append(f'<div class="cell" style="grid-area:{r}/{c}">{"".join(parts)}'
                   f'<div class="pal"><span>{x["宫"]}{shen}</span><span>{x["干支"]}</span></div></div>')
    out.append(f'<div class="mid"><strong>{title}</strong><span>据视频里后期贴的电子命盘重排，<b>不算倪师的话</b>。'
               '只画带庙旺陷的星曜；十二长生、博士、岁前、将前诸神和岁数没画。</span></div></div>')
    return "\n".join(out)


def chart_md(cells, title):
    grid = [["" for _ in range(4)] for _ in range(4)]
    for z, (r, c) in GRID.items():
        x = cells.get(z)
        if not x:
            grid[r - 1][c - 1] = f"（{z}：没贴过）"
            continue
        stars = " ".join("".join(s) for s in x["主"] + x["辅"])
        grid[r - 1][c - 1] = f"**{x['宫']} {x['干支']}**{'（身宫）' if x['身'] else ''}<br>{stars or '（无主星、辅星）'}"
    grid[1][1] = f"**{title}**"
    grid[1][2] = "据视频叠图重排"
    grid[2][1] = "后期贴图，不算倪师的话"
    lines = ["| 巳 | 午 | 未 | 申 |", "|---|---|---|---|"] + ["| " + " | ".join(row) + " |" for row in grid]
    return "\n".join(lines)


# ───────────────────────── 渲染 ─────────────────────────

def burl(ep, frame):
    p = EP_INFO[ep].get("p") or int(ep[1:])   # 分 P 号 = 集号数字（11-12 对过 B 站快照）
    return f"https://www.bilibili.com/video/{BV}/?p={p}&t={int(frame / FPS)}"


def span(a, b):
    ta, tb = tc(a / FPS), tc(b / FPS)
    return ta if ta == tb else f"{ta}–{tb}"


def fr(a, b):
    return f"第 {a} 帧" if a == b else f"第 {a}–{b} 帧"


def a_tag(ep, a, b):
    return f'<a href="{burl(ep, a)}" target="_blank" rel="noopener">{span(a, b)}</a>'


def frame_text(m):
    """帧号统一写成「第 a–b 帧」（各块写手有的带空格有的不带）。"""
    return f"第 {m.group(1)}–{m.group(2)} 帧" if m.group(2) else f"第 {m.group(1)} 帧"


def link_html(ep, s):
    out = html.escape(s, quote=False)
    out = FRAME_RE.sub(lambda m: a_tag(ep, int(m.group(1)), int(m.group(2) or m.group(1))) + "，" + frame_text(m), out)
    return re.sub(r"（([^（）]*帧[^（）]*)）", r'<span class="cite">（\1）</span>', out)


def link_md(ep, s):
    def rep(m):
        a, b = int(m.group(1)), int(m.group(2) or m.group(1))
        return f"[{span(a, b)}]({burl(ep, a)})，{frame_text(m)}"
    return FRAME_RE.sub(rep, s.replace("|", "\\|"))


CSS = """
:root{--ground:#f6f7f6;--paper:#fff;--ink:#1d2320;--ink2:#4f5a55;--ink3:#86918c;--line:#dfe4e1;--cue:#f3f5f2;--accent:#2f4a3e;
--say:#2f5f8a;--say-bg:#e8f0f8;--ov:#7a4b12;--ov-bg:#fbf0e0;--chalk:#2f6a4d;--chalk-bg:#e6f2eb;--point:#6b3f86;--point-bg:#f2eaf6;--infer:#8a3b3b;--infer-bg:#f8e9e7}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ground:#151917;--paper:#1d2321;--ink:#e8ece9;--ink2:#b3bcb7;--ink3:#7f8a85;--line:#2f3833;--cue:#222a27;--accent:#8fc0a6;
--say:#9cc3ea;--say-bg:#1e2c3a;--ov:#f0b065;--ov-bg:#3a2c19;--chalk:#7fcf9f;--chalk-bg:#1f3329;--point:#d3a8ea;--point-bg:#2f2338;--infer:#f0a097;--infer-bg:#3a2320}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--ground);color:var(--ink);font:15px/1.75 "Noto Sans SC","PingFang SC","Hiragino Sans GB",system-ui,sans-serif;padding:36px 18px 64px}
.wrap{max-width:1040px;margin:0 auto}
.banner{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin-bottom:18px;color:var(--ink2);font-size:13.5px}
.banner b{color:var(--ink)}
.sheet{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:26px 28px 22px}
h1{font-family:"Noto Serif SC","Songti SC",serif;font-size:23px;line-height:1.4;margin:0 0 10px;text-wrap:balance}
h2{font-family:"Noto Serif SC","Songti SC",serif;font-size:19px;line-height:1.4;margin:34px 0 8px;padding-top:18px;border-top:2px solid var(--accent);text-wrap:balance}
h3{font-family:"Noto Serif SC","Songti SC",serif;font-size:17px;line-height:1.45;margin:30px 0 4px;text-wrap:balance;scroll-margin-top:14px}
h3 .no{display:inline-block;min-width:1.6em;color:var(--accent)}
a{color:inherit;text-decoration-color:var(--line);text-underline-offset:3px}
a:hover{color:var(--accent);text-decoration-color:var(--accent)}
a:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:3px}
blockquote{margin:0 0 14px;padding:10px 14px;border-left:3px solid var(--line);color:var(--ink2);font-size:13.5px;background:var(--cue);border-radius:0 8px 8px 0}
blockquote p{margin:4px 0}
.facts{color:var(--ink2);font-size:13.5px;margin:0 0 6px}
.facts b{color:var(--ink);font-variant-numeric:tabular-nums}
table{width:100%;border-collapse:collapse;margin:8px 0 14px}
thead th{font-size:12.5px;letter-spacing:.06em;color:var(--ink3);text-align:left;padding:8px 12px;border-bottom:2px solid var(--accent)}
td{vertical-align:top;padding:12px;border-bottom:1px solid var(--line)}
td:first-child{width:24%;background:var(--cue);color:var(--ink);font-size:14.5px;font-weight:600}
td:last-child{color:var(--ink)}
.it{margin:0 0 7px}.it:last-child{margin-bottom:0}
.tag{display:inline-block;font-size:11.5px;font-weight:600;padding:0 7px;border-radius:999px;margin-right:4px;vertical-align:1px}
.t-say{color:var(--say);background:var(--say-bg)}.t-ov{color:var(--ov);background:var(--ov-bg)}.t-chalk{color:var(--chalk);background:var(--chalk-bg)}
.t-point{color:var(--point);background:var(--point-bg)}.t-infer{color:var(--infer);background:var(--infer-bg)}
.ref,.cite{color:var(--ink3);font-size:12.5px;font-variant-numeric:tabular-nums}
.ref::before{content:"（"}.ref::after{content:"）"}
.toc{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px 28px;margin:6px 0 0;padding:0;list-style:none}
.toc li{display:flex;gap:8px;align-items:baseline;padding:3px 0;border-bottom:1px dashed var(--line)}
.toc .no{color:var(--accent);font-weight:600;min-width:1.2em}
.toc .t{color:var(--ink3);font-size:12.5px;margin-left:auto;white-space:nowrap;font-variant-numeric:tabular-nums}
.toc-h{margin:14px 0 2px;color:var(--ink2);font-size:13.5px;font-weight:600}
.sum{background:var(--cue);border-radius:10px;padding:12px 16px;margin:0 0 10px}
.sum h4{margin:8px 0 2px;font-size:13px;color:var(--accent);letter-spacing:.04em}
.sum h4:first-child{margin-top:0}
.sum ul{margin:0;padding-left:1.2em}.sum li{margin:3px 0}
details{margin:0 0 6px;color:var(--ink2);font-size:13.5px}
summary{cursor:pointer;color:var(--ink3);padding:4px 0}
summary:hover{color:var(--accent)}
details ol{margin:6px 0 0;padding-left:1.6em}details li{margin:4px 0}
.back{float:right;font-size:12.5px;color:var(--ink3);font-family:"Noto Sans SC","PingFang SC",system-ui,sans-serif;font-weight:400}
.chart{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(4,minmax(104px,auto));border:1px solid var(--line);border-radius:10px;overflow:hidden;margin:10px 0 8px}
.cell{border:.5px solid var(--line);padding:7px 8px 5px;font-size:12.5px;line-height:1.5;display:flex;flex-direction:column;gap:1px;min-width:0}
.cell .main{font-weight:600;font-size:14px}
.cell .aux{color:var(--ink2)}
.cell .misc{color:var(--ink3);font-size:11.5px;line-height:1.45}
.cell i{font-style:normal;font-size:.8em;color:var(--ink3);margin-left:1px;font-weight:400}
.cell em{font-style:normal;font-size:.78em;font-weight:600;color:var(--infer);margin-left:1px}
.cell .pal{margin-top:auto;padding-top:4px;display:flex;justify-content:space-between;gap:4px;color:var(--accent);font-size:12.5px;font-weight:600}
.cell .shen{font-size:.78em;margin-left:3px;color:var(--ink3);font-weight:400}
.cell.none{background:var(--cue)}
.mid{grid-area:2/2/4/4;border:.5px solid var(--line);display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;text-align:center;padding:14px 18px;color:var(--ink3);font-size:12.5px}
.mid strong{font-family:"Noto Serif SC","Songti SC",serif;font-size:17px;color:var(--ink)}
.mid b{color:var(--ink2)}
.two{color:var(--ink2);font-size:13.5px;margin:6px 0}
@media (max-width:640px){body{padding:18px 16px 48px}.sheet{padding:18px 14px}td:first-child{width:32%}table{font-size:14px}td{padding:10px 8px}
.cell{font-size:11px;padding:4px 4px 3px}.cell .main{font-size:12px}.cell .misc{display:none}.mid{padding:8px;font-size:11px}.mid strong{font-size:14px}.back{display:none}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
"""

LEGEND_HTML = ('依据标记：<span class="tag t-say">口述</span>字幕与语音两路对得上的话，「」里是字幕原字 '
               '·<span class="tag t-ov">叠图</span>后期贴的电子命盘，<strong>不算倪师的话</strong> '
               '·<span class="tag t-chalk">板书</span>粉笔字（看过那一帧原图才写） '
               '·<span class="tag t-point">指代</span>「这里 / 这个」指哪（只收核过、确定的） '
               '·<span class="tag t-infer">推断</span>笔记作者自己的推断。每条后面的时间码点一下，跳到 B 站那一秒。')
LEGEND_MD = ("依据标记：〔口述〕字幕与语音两路对得上的话，「」里是字幕原字 ·〔叠图〕后期贴的电子命盘，**不算倪师的话** "
             "·〔板书〕粉笔字（看过那一帧原图才写）·〔指代〕「这里 / 这个」指哪（只收核过、确定的）·〔推断〕笔记作者自己的推断。"
             "每条后面的时间码可以点，跳到 B 站那一秒。")
SUM_NAMES = [("通用规则", "通用规则"), ("只在本例", "只在本例"), ("处世方法", "不是排盘规则，是处世方法")]


def pick_summary(base, notes):
    p = f"{base}/全集总结选条.json"
    if not os.path.exists(p):
        return None
    sel = json.load(open(p))
    out = {}
    for k, lst in sel.items():
        out[k] = [(n, notes[n]["总结候选"][k][i]) for n, i in lst]
    return out


def render(ep, base, blocks, rows, notes, overlay, tot, today):
    if not (EP_INFO.get(ep) or {}).get("标题"):
        raise SystemExit(f"EP_INFO 里没有 {ep} 的标题：先在 第0步/全量配置/EP_INFO.json 补上（--check 不需要）")
    info = EP_INFO[ep]
    last = blocks[-1]["止帧"]
    title = f"{ep} · {info['标题']}"
    cases, order = {}, []
    for b in blocks:
        if b["命例"] not in cases:
            cases[b["命例"]] = []
            order.append(b["命例"])
        cases[b["命例"]].append(b)
    top = pick_summary(base, notes)
    q = tot["引文段"] or 1
    rest = tot["引文段"] - tot["原字"]

    H = [f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">',
         '<meta name="viewport" content="width=device-width,initial-scale=1">',
         f'<title>{ep} 康奈尔笔记</title>',
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700&family=Noto+Sans+SC:wght@400;500;600&display=swap">',
         f'<style>{CSS}</style></head><body><div class="wrap">',
         f'<div class="banner"><b>{today} 整理。</b>依据 DeepSeek 逐帧记录与现成的五层材料（字幕、语音、叠图、板书、指代），'
         '由 Claude（Opus 5.5 子代理）分段起草，引文由程序逐段对过字幕。流程 2026-11-11 经站长认可。</div>',
         f'<div class="sheet"><h1 id="top">{html.escape(title)}<span class="ref">{span(0, last)}，共 {last + 1:,} 帧</span></h1>',
         f'<blockquote><p>{LEGEND_HTML}</p></blockquote>',
         f'<p class="facts">全集 <b>{int(last / FPS // 60)} 分 {int(last / FPS % 60)} 秒</b>，分 <b>{len(blocks)}</b> 段、<b>{tot["行"]}</b> 个提示、<b>{tot["条"]}</b> 条笔记。'
         f'〔口述〕里引的原话共 <b>{tot["引文段"]}</b> 段，'
         + (f'<b>全部</b>在字幕里原字找到；' if rest == 0 else
            f'<b>{tot["原字"]}</b> 段在字幕里原字找到（{tot["原字"] / q:.1%}），其余 {rest} 段与字幕只差一两个字；')
         + f'另有 <b>{tot["待核"]}</b> 处拿不准的地方收在各段「待核」里。</p>']
    M = [f"# {title}（{span(0, last)}，共 {last + 1:,} 帧）", "",
         f"> {today} 整理。依据 DeepSeek 逐帧记录与现成的五层材料（字幕、语音、叠图、板书、指代），由 Claude（Opus 5.5 子代理）分段起草，引文由程序逐段对过字幕。流程 2026-11-11 经站长认可。",
         f"> {LEGEND_MD}", ""]

    if top:
        H.append('<h2 id="sum">全集总结</h2><div class="sum">')
        M += ["## 全集总结", ""]
        for k, name in SUM_NAMES:
            if not top.get(k):
                continue
            H.append(f"<h4>{name}</h4><ul>")
            M.append(f"**{name}**")
            M.append("")
            for n, s in top[k]:
                H.append(f"<li>{link_html(ep, s)}</li>")
                M.append(f"- {link_md(ep, s)}")
            H.append("</ul>")
            M.append("")
        H.append("</div>")

    H.append('<h2 id="toc">目录</h2>')
    M += ["## 目录", ""]
    for ci, name in enumerate(order, 1):
        H.append(f'<p class="toc-h"><a href="#c{ci}">{html.escape(name)}</a></p><ul class="toc">')
        M.append(f"**{name}**")
        M.append("")
        for b in cases[name]:
            d = notes[b["块"]]
            H.append(f'<li><span class="no">{b["块"]}</span><a href="#b{b["块"]}">{html.escape(d["小标题"])}</a>'
                     f'<span class="t">{span(b["起帧"], b["止帧"])}</span></li>')
            M.append(f"{b['块']}. {d['小标题']}（{span(b['起帧'], b['止帧'])}）")
        H.append("</ul>")
        M.append("")

    bounds = {name: (cases[name][0]["起秒"], cases[name][-1]["止秒"] + 0.1) for name in order}
    for ci, name in enumerate(order, 1):
        H.append(f'<h2 id="c{ci}">{html.escape(name)}</h2>')
        M += [f"## {name}", ""]
        cells = chart_cells(overlay, *bounds[name])
        short = name.split("（")[0]
        ming = next((f"命宫{x['干支']}" for x in cells.values() if x["宫"] == "命宫"), "")
        if len(cells) >= 8:
            H.append(chart_html(cells, f"{short} · {ming}"))
            M += [chart_md(cells, f"{short} · {ming}"), ""]
        elif cells:
            txt = "；".join(f"{x['宫']} {x['干支']}：" + "、".join("".join(s) for s in x["主"] + x["辅"] + x["杂"])
                           for x in sorted(cells.values(), key=lambda x: -x["次数"]))
            H.append(f'<p class="two"><span class="tag t-ov">叠图</span>这一例视频里只贴过 {len(cells)} 格：{html.escape(txt)}。</p>')
            M += [f"〔叠图〕这一例视频里只贴过 {len(cells)} 格：{txt}。", ""]
        for b in cases[name]:
            n, d = b["块"], notes[b["块"]]
            H.append(f'<h3 id="b{n}"><a class="back" href="#toc">回目录</a><span class="no">{n}</span>{html.escape(d["小标题"])}'
                     f'<span class="ref">{a_tag(ep, b["起帧"], b["止帧"])}，{fr(b["起帧"], b["止帧"])}</span></h3>')
            H.append("<table><thead><tr><th>提示区</th><th>笔记区</th></tr></thead><tbody>")
            M += [f"### {n}　{d['小标题']}（[{span(b['起帧'], b['止帧'])}]({burl(ep, b['起帧'])})，{fr(b['起帧'], b['止帧'])}）", "",
                  "| 提示区 | 笔记区 |", "|---|---|"]
            for row in d["行"]:
                hs, ms = [], []
                for it in row["条目"]:
                    a, e = it["起帧"], it["止帧"]
                    hs.append(f'<div class="it"><span class="tag {TAGS[it["标签"]]}">{it["标签"]}</span>{html.escape(it["文字"], quote=False)}'
                              f'<span class="ref">{a_tag(ep, a, e)}，{fr(a, e)}</span></div>')
                    ms.append(f"〔{it['标签']}〕{it['文字'].replace('|', chr(92) + '|')}（[{span(a, e)}]({burl(ep, a)})，{fr(a, e)}）")
                H.append(f'<tr><td>{html.escape(row["提示"])}</td><td>{"".join(hs)}</td></tr>')
                M.append(f"| **{row['提示']}** | {'<br>'.join(ms)} |")
            H.append("</tbody></table>")
            M.append("")
            H.append('<div class="sum">')
            M += ["**总结区**", ""]
            for k, label in SUM_NAMES:
                lst = d["总结候选"].get(k) or []
                if not lst:
                    continue
                H.append(f"<h4>{label}</h4><ul>" + "".join(f"<li>{link_html(ep, s)}</li>" for s in lst) + "</ul>")
                M += [f"- {label}：" + "；".join(link_md(ep, s) for s in lst)]
            H.append("</div>")
            M.append("")
            if d["待核"]:
                H.append(f'<details><summary>待核 {len(d["待核"])} 条（字幕和语音对不上的字、认不出的板书、没说清的地方）</summary><ol>'
                         + "".join(f"<li>{link_html(ep, s)}</li>" for s in d["待核"]) + "</ol></details>")
                M += ["**待核**", ""] + [f"{i + 1}. {link_md(ep, s)}" for i, s in enumerate(d["待核"])] + [""]
    H.append("</div></div></body></html>")
    # --out=目录：直接写进笔记仓库（如 ../笔记仓库/nishi-ziwei-notes-deepseek/康奈尔笔记/P17），文件名 <集号>-康奈尔笔记
    out_dir = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--out=")), None)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
        out = os.path.join(out_dir, f"{ep}-康奈尔笔记")
    else:
        out = f"../康奈尔样稿/{ep}-整集第一稿"
    open(out + ".html", "w").write("\n".join(H) + "\n")
    open(out + ".md", "w").write("\n".join(M) + "\n")
    print("已写：", os.path.abspath(out + ".html"), os.path.getsize(out + ".html") // 1024, "KB；md",
          os.path.getsize(out + ".md") // 1024, "KB")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ep = args[0] if args else "P17"
    today = args[1] if len(args) > 1 else "2026-11-11"
    base, blocks, rows, notes, overlay = load(ep)
    report = check(ep, blocks, rows, notes, overlay)
    tot = print_report(report)
    json.dump(report, open(f"{base}/校验报告.json", "w"), ensure_ascii=False, indent=1)
    if "--list" in sys.argv:
        kinds = [a.split("=", 1)[1] for a in sys.argv if a.startswith("--kind=")]
        for n, k, s in report["问题"]:
            if not kinds or k in kinds:
                print(f"[块{n}·{k}] {s}")
    if "--check" not in sys.argv:
        render(ep, base, blocks, rows, notes, overlay, tot, today)


if __name__ == "__main__":
    main()

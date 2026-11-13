#!/usr/bin/env python3
"""按句拼接：把现成的几层按「字幕句」拼成一张表，不调任何接口。

每句 = 苹果识别的一条字幕（时间轴基准），挂上：
  · 语音：whisper 字词里，中点落在「本句起 → 下一句起」之间的字
  · 逐帧层：这段帧里 手可见 / 触板 / 动作 / 叠图变化 / 异常 的汇总，和逐帧层自己读到的字幕众数
  · 叠图：和这段时间有重叠的叠图状态（「重复于」解析回原条目）
  · 指代：说出帧落在这句里的指代题（Claude 盲标 + Kimi 回答）
  · 姿态：这段里切镜头的次数

用法（在 第0步/ 下）：
  ../.venv-vision/bin/python join_sentences.py P17
输入（11-12 起 17 集通用）：
  逐帧层：先找 逐帧层/试点/<集>.jsonl（P17、P05），没有就读 逐帧层/全量/<集>.jsonl（其余 15 集；两边格式相同，11-12 核过）
  指代题：指代层/试点/<集>/题目清单.json（没有再找 指代层/全量/<集>/）；盲标结果读 盲标/结果/批*.json，
          试点批 = 批01–批30，全量批 = 批<集>-NN（如 批P11-03）；题号带集号（P17-D001），各集不会串
输出（目录名虽叫「试点」，17 集都放这里；下游提示词模板和 cornell_* 都依赖这个路径，别改）：
  按句拼接/试点/P17.jsonl        每句一行
  按句拼接/试点/P17-可读.md      给人 / 给写笔记的模型看的版本
  按句拼接/试点/P17-统计.json    覆盖数字
"""
import collections
import glob
import json
import os
import sys

FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))


def frames_path(ep):
    """逐帧层文件：试点两集在 逐帧层/试点/，其余 15 集在 逐帧层/全量/。"""
    p = f"逐帧层/试点/{ep}.jsonl"
    return p if os.path.exists(p) else f"逐帧层/全量/{ep}.jsonl"


def first_existing(*paths):
    return next((p for p in paths if os.path.exists(p)), None)


def merge_config(base, name):
    """代码里原有的条目 + 第0步/全量配置/<name>.json 合并（以后每集只往 json 里加一条）。
    json 里以 _ 开头的键是说明，跳过；同一集两边都有时以 json 为准，并在 stderr 提示。"""
    out = dict(base)
    p = os.path.join(HERE, "全量配置", f"{name}.json")
    if os.path.exists(p):
        for k, v in json.load(open(p)).items():
            if k.startswith("_"):
                continue
            if k in base:
                print(f"注意：全量配置/{name}.json 覆盖了代码里的 {k}", file=sys.stderr)
            out[k] = v
    return out


def tc(sec: float) -> str:
    sec = max(0, int(sec))
    return f"{sec // 3600:02d}:{sec % 3600 // 60:02d}:{sec % 60:02d}"


def load_frames(ep):
    """逐帧层：按窗号去重（补跑会有重复行），失败窗跳过。返回 {帧号: 行}"""
    wins, failed = {}, set()
    for line in open(frames_path(ep)):
        d = json.loads(line)
        for r in d.get("行") or []:
            if "动作" not in r and "動作" in r:   # 全量 P01 有 12 行模型把键写成繁体「動作」
                r["动作"] = r.pop("動作")
        if d.get("行"):
            wins[d["窗"]] = d
            failed.discard(d["窗"])
        elif d["窗"] not in wins:
            failed.add(d["窗"])
    rows = {}
    for d in wins.values():
        # 模型回写的帧号偶尔抄错（P17 有 648 行），行数与窗内帧数相等时一律按位置对回
        if len(d["行"]) == len(d["帧"]):
            for f, r in zip(d["帧"], d["行"]):
                rows[f] = r
        else:
            ok = set(d["帧"])
            for r in d["行"]:
                if r["f"] in ok:
                    rows[r["f"]] = r
    return rows, len(wins), sorted(failed)


def load_overlay(ep):
    """叠图定稿：编号 → 条目；「重复于」解析回原条目的格内容。"""
    by_id = {}
    for line in open("叠图转写/叠图定稿-v2.jsonl"):
        d = json.loads(line)
        if d["集"] == ep:
            by_id[d["编号"]] = d
    out = []
    for d in by_id.values():
        src = d
        seen = set()
        while src.get("重复于") and src["重复于"] in by_id and src["编号"] not in seen:
            seen.add(src["编号"])
            src = by_id[src["重复于"]]
        out.append({
            "编号": d["编号"], "起秒": d["起秒"], "止秒": d["止秒"],
            "内容取自": src["编号"], "依据": src.get("依据"),
            "格": src.get("格") or {}, "格外文字": src.get("格外文字") or [],
        })
    out.sort(key=lambda x: (x["起秒"], x["编号"]))
    return out


def load_deixis(ep):
    qp = first_existing(f"指代层/试点/{ep}/题目清单.json", f"指代层/全量/{ep}/题目清单.json")
    if not qp:
        raise SystemExit(f"{ep} 还没有指代题目清单（指代层/试点/{ep}/题目清单.json）：先跑 pilot_deixis.py 出题 {ep}")
    qs = json.load(open(qp))
    blind = {}
    # 试点批 批01–批30、全量批 批<集>-NN 都在 结果/ 里，glob 一起读；题号带集号，不会串集
    for f in sorted(glob.glob("指代层/试点/盲标/结果/批*.json")) + sorted(glob.glob("指代层/全量/盲标/结果/批*.json")):
        for x in json.load(open(f)):
            blind[x["题号"]] = x
    kimi = {}
    p = first_existing(f"指代层/试点/{ep}/Kimi-v2.jsonl", f"指代层/全量/{ep}/Kimi-v2.jsonl")
    if p:
        for line in open(p):
            d = json.loads(line)
            kimi[d["题号"]] = d.get("答") or {}
    out = []
    for q in qs:
        b = blind.get(q["题号"])
        out.append({
            "题号": q["题号"], "词": q["词"], "说出帧": q["说出帧"], "说出秒": q["说出秒"],
            "盲标": b and {k: b.get(k) for k in ("是指代", "指向", "目标文字", "宫位或盘", "格", "把握", "说明")},
            "Kimi": kimi.get(q["题号"]) and {k: kimi[q["题号"]].get(k) for k in ("是指代", "指向", "目标文字", "宫位或盘", "格")},
        })
    return out


def load_cuts(ep):
    cuts = []
    for part in ("上", "下"):
        p = f"姿态/{ep}-{part}.jsonl"
        if os.path.exists(p):
            for line in open(p):
                d = json.loads(line)
                if d.get("切镜头"):
                    cuts.append(d["f"])
    return sorted(set(cuts))


LEGEND = [
    "每行：`[序号 时间码 第起–管到帧]` 字幕（字幕识别可信度）｜语音｜手",
    "· 「字幕」是画面上烧录字幕的识别结果；「语音」是语音识别，同音错字多（如「福德功」= 福德宫），并且是按时间切的，可能有一两个字串到相邻句。",
    "· 「手」来自逐帧层：手可见 / 触板占这句帧数的比例，后面是 指 / 写 / 擦 的帧数（30 帧 = 1 秒）。",
    "· ▣ 是后期贴在画面上的电子命盘（叠图），不是倪师写的；同一宫的内容在本文件里只印一次，之后只列宫名。",
    "  数字串是印刷的岁数，转写时丢了标点（如「312」原印「3~12」，「71931、435567」原印「7,19,31 43,55,67」）。",
    "· ☞ 是指代题：说「这个 / 这里」那一刻手指在哪，由 Claude 看原帧标注；只有「是（确定）」的能当依据。",
]


def cell_sig(key, items):
    return tuple(sorted(x for x in items if x and x not in key))


def render(rows, ov_by_id, after=None):
    """可读稿：同一宫的内容只印一次，之后只列宫名。after = {序号: [这句后面要插的行]}"""
    lines, printed, shown = [], {}, None
    for r in rows:
        cells = {}
        for oid in r["叠图"]:
            for k, v in ov_by_id[oid]["格"].items():
                cells.setdefault(k, v)
        cur = tuple(sorted(cells))
        if cur and cur != shown:
            t0 = min(ov_by_id[o]["起秒"] for o in r["叠图"])
            lines.append(f"  ▣ 叠图（约 {tc(t0)} 起）：" + "、".join(cur))
            for k in cur:
                sig = cell_sig(k, cells[k])
                if printed.get(k) != sig:
                    printed[k] = sig
                    lines.append(f"      【{k}】" + "、".join(sig))
        if cur:
            shown = cur
        fz = r["逐帧"]
        hand = ""
        if fz["帧数"]:
            acts = "、".join(f"{k}{v}" for k, v in sorted(fz["动作"].items(), key=lambda kv: -kv[1]) if k not in ("讲", None))
            hand = f"｜手可见 {fz['手可见']:.0%}，触板 {fz['触板是']:.0%}" + (f"，{acts}" if acts else "")
        cut = f"｜画面切换 {r['切镜头']} 次" if r.get("切镜头") else ""
        lines.append(f"[{r['序号']:04d} {r['时间码']} 第{r['起帧']}–{r['管到帧']}帧] {r['字幕']}（{r['可信']}）｜语音：{r['语音'] or '—'}{hand}{cut}")
        lines.extend((after or {}).get(r["序号"], []))
        for d in r["指代"]:
            b = d["盲标"]
            if not b:
                continue
            lines.append(f"    ☞ {d['题号']}「{d['词']}」第{d['说出帧']}帧：{b['是指代']}（{b['把握']}）指向 {b['指向']}，"
                         f"看得见的字「{b['目标文字']}」，{b['宫位或盘']}｜{b['说明']}")
    return lines


def main(ep):
    miss = [p for p in (f"../字幕/苹果识别/{ep}.jsonl", f"../字幕/语音/{ep}-字词.json", frames_path(ep),
                        "叠图转写/叠图定稿-v2.jsonl") if not os.path.exists(p)]
    if not first_existing(f"指代层/试点/{ep}/题目清单.json", f"指代层/全量/{ep}/题目清单.json"):
        miss.append(f"指代层/试点/{ep}/题目清单.json（pilot_deixis.py 出题 {ep}）")
    if miss:
        raise SystemExit(f"{ep} 缺输入，先补齐：" + "、".join(miss))
    if not any(os.path.exists(f"姿态/{ep}-{x}.jsonl") for x in ("上", "下")):
        print(f"注意：{ep} 没有 姿态/{ep}-上/下.jsonl，「切镜头」全记 0", file=sys.stderr)
    subs = [json.loads(l) for l in open(f"../字幕/苹果识别/{ep}.jsonl")]
    words = json.load(open(f"../字幕/语音/{ep}-字词.json"))["transcription"]
    frames, n_win, failed = load_frames(ep)
    overlay = load_overlay(ep)
    deixis = load_deixis(ep)
    cuts = load_cuts(ep)
    last_frame = max(frames) if frames else subs[-1]["止帧"]

    # 每句管的范围：本句起帧 → 下一句起帧（最后一句到片尾）；第一句往前管到 0
    spans = []
    for i, s in enumerate(subs):
        a = 0 if i == 0 else s["起帧"]
        b = subs[i + 1]["起帧"] if i + 1 < len(subs) else last_frame + 1
        spans.append((a, b))

    # 语音字词按中点归句
    voice = [[] for _ in subs]
    wi = 0
    starts = [a for a, _ in spans]
    import bisect
    for w in words:
        mid = (w["offsets"]["from"] + w["offsets"]["to"]) / 2000 * FPS
        k = max(0, bisect.bisect_right(starts, mid) - 1)
        t = w["text"].strip()
        if t and not t.startswith("["):
            voice[k].append(t)

    out, stat = [], collections.Counter()
    for i, s in enumerate(subs):
        a, b = spans[i]
        fr = [frames[f] for f in range(a, b) if f in frames]
        n = len(fr)
        act = collections.Counter(r.get("动作") for r in fr)
        touch = collections.Counter(r.get("触板") for r in fr)
        sub_mode = collections.Counter(r.get("字幕") or "" for r in fr).most_common(1)
        ov = [o for o in overlay if o["起秒"] * FPS < b and (o["止秒"] + 1) * FPS > a]
        dx = [d for d in deixis if a <= d["说出帧"] < b]
        row = {
            "序号": s["序号"], "起帧": s["起帧"], "止帧": s["止帧"], "管到帧": b - 1,
            "起秒": s["起秒"], "止秒": s["止秒"], "时间码": tc(s["起秒"]),
            "字幕": s["字幕"], "可信": s["可信"], "标记": s["标记"],
            "语音": "".join(voice[i]),
            "逐帧": {
                "帧数": n, "应有帧数": b - a,
                "字幕众数": sub_mode[0][0] if sub_mode else "",
                "手可见": round(sum(1 for r in fr if r.get("手可见")) / n, 2) if n else None,
                "触板是": round(touch.get("是", 0) / n, 2) if n else None,
                "动作": dict(act),
                "叠图变化帧": sum(1 for r in fr if r.get("叠图变化")),
                "异常帧": sum(1 for r in fr if r.get("异常")),
            },
            "叠图": [o["编号"] for o in ov],
            "指代": dx,
            "切镜头": sum(1 for c in cuts if a <= c < b),
        }
        out.append(row)
        stat["句"] += 1
        stat["有逐帧层"] += n > 0
        stat["逐帧层全覆盖"] += n == b - a
        stat["有语音"] += bool(row["语音"])
        stat["挂上叠图"] += bool(ov)
        stat["挂上指代题"] += bool(dx)
        stat["挂上已确认指代"] += any(d["盲标"] and d["盲标"]["是指代"] == "是" and d["盲标"]["把握"] == "确定" for d in dx)
        stat["有写"] += act.get("写", 0) > 0
        stat["有指"] += act.get("指", 0) > 0

    os.makedirs("按句拼接/试点", exist_ok=True)
    with open(f"按句拼接/试点/{ep}.jsonl", "w") as f:
        for r in out:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    confirmed = [d for d in deixis if d["盲标"] and d["盲标"]["是指代"] == "是" and d["盲标"]["把握"] == "确定"]
    summary = {
        "集": ep, **stat,
        "逐帧层有效窗": n_win, "逐帧层失败窗": failed, "逐帧层帧数": len(frames),
        "语音字词": len(words), "语音归句字数": sum(len(v) for v in voice),
        "叠图状态": len(overlay), "叠图里的宫": sorted({k for o in overlay for k in o["格"]}),
        "指代题": len(deixis), "已确认指代": len(confirmed),
        "已确认指代没挂上": [d["题号"] for d in confirmed if not any(d["题号"] == x["题号"] for r in out for x in r["指代"])],
        "切镜头": len(cuts),
    }
    json.dump(summary, open(f"按句拼接/试点/{ep}-统计.json", "w"), ensure_ascii=False, indent=1)

    # 可读稿
    ov_by_id = {o["编号"]: o for o in overlay}
    head = [f"# {ep} 按句拼接（程序生成，未经人工校对）", ""] + LEGEND + [""]
    open(f"按句拼接/试点/{ep}-可读.md", "w").write("\n".join(head + render(out, ov_by_id)) + "\n")
    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "P17")

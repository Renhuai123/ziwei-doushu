#!/usr/bin/env python3
"""把按句拼接的结果切成几块，给写笔记的模型当材料；同时抽板书候选帧。不调任何接口。

切法：先按命例切（依据擦板段），命例内再按时长均分，边界吸附到附近最大的字幕间隙。
每块材料 = 前文约 20 秒（只供理解）+ 本块正文 + 后文约 20 秒（只供理解）+ 板书图清单。
板书图 = 一段连续写板书结束后、手离开黑板的那一帧（没有就取结束后 1 秒）。

用法（在 第0步/ 下，先跑过 join_sentences.py）：
  ../.venv-vision/bin/python cornell_blocks.py P17
输出：
  按句拼接/试点/P17-笔记块/块N-材料.md
  按句拼接/试点/P17-笔记块/分块.json
  按句拼接/试点/P17-板书帧/fXXXXXX.jpg      （视频帧有版权，不进任何仓库）
"""
import json
import os
import subprocess
import sys

from join_sentences import FPS, LEGEND, load_frames, load_overlay, merge_config, render, tc

# 命例边界（秒）与每个命例切几块。依据：逐帧层的擦板段 + 叠图里命盘换了一张。
# 每条 = (标签, 起秒, 止秒或 None, 切几块)。试点两集写在代码里；其余各集写进 第0步/全量配置/PLAN.json，
# 那里每条也可以直接贴分段读手回的「大段」对象（键 标签 / 起秒 / 止秒 / 切几块，多余的键如 边界依据 不管）。
PLAN = {
    "P17": [
        # 命例之间的边界直接给到那句话的起秒（看过原句定的）：33:24「那还有呢」、40:49「下面有个很好玩的八字的」
        ("例一（叠图命盘：命宫癸未）", 0, 2004.6, 6),
        ("过渡 + 例二（叠图命盘：命宫壬戌，只贴过命宫、迁移两格）", 2004.6, 2449.2, 1),
        ("例三（叠图命盘：命宫己未）", 2449.2, None, 2),
    ],
    # P05 没有命例、没有叠图，按讲题切（11-11 opus-high-reader 通读全集提议，边界 = 擦板 + 空板重写 + 转场句）：
    # 18:48「那人在逢到权、科、禄的时候」、25:56「现在我们介绍诸星啊」、47:57「这是南斗星系」
    "P05": [
        ("开场 + 四化：科、权、禄、忌", 0, 1128.2, 3),
        ("四化的气色与看色避祸", 1128.2, 1556.4, 1),
        ("诸星（上）：紫微、天机、太阳、武曲、天同、廉贞", 1556.4, 2877.4, 4),
        ("诸星（下）：南斗起，天府、太阴、天梁、天相", 2877.4, None, 2),
    ],
}
PLAN = merge_config(PLAN, "PLAN")
CTX_SEC = 20          # 前后文各带多少秒
SNAP_SEC = 15         # 边界吸附范围
GAP_MERGE = 60        # 写段：间隙不超过这么多帧就并成一段
MIN_WRITE = 45        # 写段：写的帧数至少这么多才算
MAX_IMG = 14          # 每块最多几张板书图（含块首板面）
FFMPEG = "/opt/homebrew/bin/ffmpeg"


def snap(rows, t):
    """离 t 秒最近的 ±SNAP_SEC 内，取前面空隙最大的那句当新块的第一句。返回句下标。"""
    best, best_key = None, None
    for i in range(1, len(rows)):
        if abs(rows[i]["起秒"] - t) <= SNAP_SEC:
            gap = rows[i]["起帧"] - rows[i - 1]["止帧"]
            key = (gap, -abs(rows[i]["起秒"] - t))
            if best_key is None or key > best_key:
                best, best_key = i, key
    if best is None:
        best = min(range(1, len(rows)), key=lambda i: abs(rows[i]["起秒"] - t))
    return best


def write_segments(frames):
    """连续写板书的时段：[(起帧, 止帧, 写的帧数)]"""
    ws = sorted(f for f, r in frames.items() if r.get("动作") == "写")
    segs, cur = [], None
    for f in ws:
        if cur and f - cur[1] <= GAP_MERGE:
            cur[1] = f
            cur[2] += 1
        else:
            if cur:
                segs.append(tuple(cur))
            cur = [f, f, 1]
    if cur:
        segs.append(tuple(cur))
    return [s for s in segs if s[2] >= MIN_WRITE]


def board_frame(frames, end, limit):
    """写段结束后找一帧看板书：优先手不在画面里，其次手离开黑板，都没有就取结束后 1 秒。不越过下一次擦板。"""
    stop = end + 240
    for f in range(end + 1, stop):
        r = frames.get(f)
        if r and r.get("动作") == "擦":
            stop = f
            break
    stop = min(stop, limit)
    for f in range(end + 1, stop):
        r = frames.get(f)
        if r and not r.get("手可见"):
            return f, "手不在画面里"
    for f in range(end + 1, min(stop, end + 150)):
        r = frames.get(f)
        if r and r.get("触板") == "否" and r.get("动作") != "写":
            return f, "手离开黑板"
    return min(end + 30, max(end + 1, stop - 1)), "写完后 1 秒（手可能挡住）"


def grab(ep, f, out_dir):
    p = f"{out_dir}/f{f:06d}.jpg"
    if not os.path.exists(p):
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-ss", f"{(f + 0.5) / FPS:.3f}",
                        "-i", f"../视频/{ep}.mp4", "-frames:v", "1",
                        "-vf", "scale=1568:-2", "-q:v", "3", p], check=True)
    return os.path.abspath(p)


def plain(rows):
    return [f"[{r['序号']:04d} {r['时间码']}] {r['字幕']}｜语音：{r['语音'] or '—'}" for r in rows]


def plan_of(ep):
    """取一集的 PLAN，统一成 [(标签, 起秒, 止秒或 None, 切几块)]，顺手查一下明显填错的地方。"""
    if ep not in PLAN:
        raise SystemExit(f"PLAN 里没有 {ep}：先在 第0步/全量配置/PLAN.json 加一条（格式见该文件的 _说明）")
    out = []
    for x in PLAN[ep]:
        if isinstance(x, dict):
            x = (x["标签"], x["起秒"], x["止秒"], x["切几块"])
        out.append(tuple(x))
    for k, (name, a, b, n) in enumerate(out):
        if not isinstance(n, int) or n < 1:
            raise SystemExit(f"{ep} PLAN 第 {k + 1} 段「{name}」切几块应是正整数：{n}")
        if k and a <= out[k - 1][1]:
            raise SystemExit(f"{ep} PLAN 第 {k + 1} 段「{name}」起秒 {a} 没有比上一段大")
        if b is None and k + 1 < len(out):
            raise SystemExit(f"{ep} PLAN 第 {k + 1} 段「{name}」不是最后一段，止秒不能是 null")
    return out


def main(ep):
    rows = [json.loads(l) for l in open(f"按句拼接/试点/{ep}.jsonl")]
    frames, _, _ = load_frames(ep)
    ov_by_id = {o["编号"]: o for o in load_overlay(ep)}
    end_sec = rows[-1]["管到帧"] / FPS

    # 1. 定边界（句下标）
    plan = plan_of(ep)
    cuts = [(0, plan[0][0])]
    for pi, (name, a, b, n) in enumerate(plan):
        b = end_sec if b is None else b
        for k in range(1, n):
            cuts.append((snap(rows, a + (b - a) * k / n), name))
        if pi + 1 < len(plan):
            cuts.append((min(range(1, len(rows)), key=lambda i: abs(rows[i]["起秒"] - b)), plan[pi + 1][0]))
    cuts.sort()
    blocks = []
    for n, (i, name) in enumerate(cuts):
        j = cuts[n + 1][0] if n + 1 < len(cuts) else len(rows)
        blocks.append({"块": n + 1, "命例": name, "句": [i, j],
                       "起帧": rows[i]["起帧"] if i else 0, "止帧": rows[j - 1]["管到帧"],
                       "起秒": rows[i]["起秒"] if i else 0, "止秒": round(rows[j - 1]["管到帧"] / FPS, 2)})

    # 2. 写段 → 板书图
    segs = write_segments(frames)
    out_dir = f"按句拼接/试点/{ep}-笔记块"
    img_dir = f"按句拼接/试点/{ep}-板书帧"
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(img_dir, exist_ok=True)

    for b in blocks:
        i, j = b["句"]
        mine = [s for s in segs if b["起帧"] <= s[1] <= b["止帧"]]
        dropped = []
        if len(mine) > MAX_IMG - 1:
            keep = sorted(mine, key=lambda s: -s[2])[:MAX_IMG - 1]
            dropped = [s for s in mine if s not in keep]
            mine = sorted(keep)
        imgs, after = [], {}
        # 块首板面
        f0 = next((f for f in range(b["起帧"], b["起帧"] + 300) if f in frames and not frames[f].get("手可见")), b["起帧"])
        imgs.append({"帧": f0, "时间码": tc(f0 / FPS), "图": grab(ep, f0, img_dir), "说明": "本块开头的板面"})
        for s, e, n in mine:
            f, why = board_frame(frames, e, b["止帧"] + 240)
            imgs.append({"帧": f, "时间码": tc(f / FPS), "图": grab(ep, f, img_dir),
                         "说明": f"{tc(s / FPS)}–{tc(e / FPS)}（第{s}–{e}帧）写了约 {n / FPS:.0f} 秒之后，{why}"})
            k = next((r["序号"] for r in rows[i:j] if r["起帧"] <= e <= r["管到帧"]), rows[j - 1]["序号"])
            after.setdefault(k, []).append(
                f"    ✎ 写板书 {tc(s / FPS)}–{tc(e / FPS)}（第{s}–{e}帧）→ 板书图 f{f:06d}.jpg（第{f}帧，{why}）")
        b["板书图"] = imgs
        b["没抽图的写段"] = [[s, e, n] for s, e, n in dropped]

        pre = [r for r in rows[:i] if r["起秒"] >= b["起秒"] - CTX_SEC]
        post = [r for r in rows[j:] if r["起秒"] <= b["止秒"] + CTX_SEC]
        md = [f"# {ep} 第 {b['块']} 块材料（{tc(b['起秒'])}–{tc(b['止秒'])}，第 {b['起帧']}–{b['止帧']} 帧）",
              "", f"所在命例：{b['命例']}", "", "程序按时间把几层现成数据拼在一起，没有人工校对。", ""]
        md += LEGEND
        md += ["· ✎ 是一段连续写板书的时间，后面给了一张写完后的板书图；图里的粉笔字要自己认，认不出就说认不出。",
               "· 行尾「画面切换」表示这句里镜头切过，手的位置前后不连续。", ""]
        if pre:
            md += [f"## 前文（{tc(pre[0]['起秒'])} 起，只供理解上下文，不要写进本块笔记）", ""] + plain(pre) + [""]
        md += ["## 本块正文", ""] + render(rows[i:j], ov_by_id, after) + [""]
        if post:
            md += [f"## 后文（到 {tc(post[-1]['止秒'])}，只供理解上下文，不要写进本块笔记）", ""] + plain(post) + [""]
        md += ["## 板书图清单（用 Read 工具逐张看）", ""]
        md += [f"- {x['图']}｜第{x['帧']}帧 {x['时间码']}｜{x['说明']}" for x in imgs]
        if dropped:
            md += ["", f"另有 {len(dropped)} 段较短的写板书没有抽图：" +
                   "、".join(f"{tc(s / FPS)}（第{s}–{e}帧）" for s, e, n in dropped)]
        open(f"{out_dir}/块{b['块']}-材料.md", "w").write("\n".join(md) + "\n")
        b["材料"] = os.path.abspath(f"{out_dir}/块{b['块']}-材料.md")
        b["材料字节"] = os.path.getsize(b["材料"])

    json.dump(blocks, open(f"{out_dir}/分块.json", "w"), ensure_ascii=False, indent=1)
    for b in blocks:
        print(f"块{b['块']} {tc(b['起秒'])}–{tc(b['止秒'])} 句{b['句'][0] + 1}–{b['句'][1]} "
              f"板书图{len(b['板书图'])} 没抽{len(b['没抽图的写段'])} 材料{b['材料字节'] // 1024}KB｜{b['命例']}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "P17")

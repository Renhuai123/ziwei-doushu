"""开源仓 ziwei-doushu 本轮更新总览图（2026-11-13，160 万帧逐帧精读并入主仓）。
用法：python update_20261113_main.py <输出.png> [宋体字体文件]（主仓用的是 docs/update-20261113.png）
样式同 update_20261112.py：宋体，改前灰 #c8ced6 / 改后蓝 #2a7ad5，五格 + 底部边界条；版面参照主仓 docs/update-20261015.png。
宋体缺 ✓ ✗ ¥ 等字形，图里一律用文字代替。
字重随 matplotlib 版本变：docs/update-20261113.png 用 3.11 出（ttc 各字重都认得，正文细、标题粗）；3.10 只认 ttc 第一个字面（Songti SC Black），全图变特粗，主仓 10-15 图就是这样出的。数字全部来自本目录 README.md、docs/工作记录.md、summaries/README.md：
- 帧数、窗数：17 集 1,604,675 帧；逐帧层每窗 12 帧，133,731 窗 11-13 全部跑满；试点两集 P17 8,134 + P05 8,742 窗；
- 笔记：工作记录「康奈尔笔记：17 集出稿」——1,734 个提示、6,413 条；引文 14,825 段里 14,824 段原字找到；待核 2,613 处；
- 指代与片源上限：工作记录「片源上限（全量统计）」；
- 公开摘要：summaries/README.md 各集要点数（合计 344）。
"""
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager

# 字体：默认用 macOS 自带宋体；别的系统可用第二个参数指定宋体字体文件
FONT = sys.argv[2] if len(sys.argv) > 2 else '/System/Library/Fonts/Supplemental/Songti.ttc'
font_manager.fontManager.addfont(FONT)
plt.rcParams['font.family'] = 'Songti SC'
GREY, BLUE, LIGHT, INK, MUTED, GREEN, RED, ORANGE = '#c8ced6', '#2a7ad5', '#8fb8e8', '#1d2320', '#6b7570', '#2f7a55', '#b23a2e', '#b06a12'

FRAMES = 1604675
WIN_PILOT, WIN_FULL = 8134 + 8742, 133731      # 试点两集（P17 + P05）/ 全量 17 集
CUES, NOTES = 1734, 6413
QUOTES, QUOTES_HIT, TODO = 14825, 14824, 2613
SUMMARY = [('P01', 9), ('P03', 22), ('P05', 20), ('P07', 21), ('P09', 22), ('P11', 22), ('P13', 22), ('P15', 22),
           ('P17', 22), ('P19', 22), ('P21', 22), ('P23', 22), ('P25', 22), ('P27', 22), ('P29', 22), ('P37', 17),
           ('P48', 13)]
assert sum(n for _, n in SUMMARY) == 344

fig = plt.figure(figsize=(12, 11), dpi=160)
fig.patch.set_facecolor('white')
fig.text(0.5, 0.962, '开源仓 ziwei-doushu  ·  本轮更新', ha='center', fontsize=23, fontweight='bold', color=INK)
fig.text(0.5, 0.932, '2026-11-13  ·  160 万帧逐帧精读并入本仓  ·  目录 research/nishi-video-reading/（连同提交历史）',
         ha='center', fontsize=11.5, color=MUTED)


def title(x, y, s):
    fig.text(x, y, s, fontsize=15, fontweight='bold', color=INK, va='center')


def clean(ax):
    for s in ('top', 'right', 'left'):
        ax.spines[s].set_visible(False)
    ax.tick_params(left=False, colors=MUTED)


# ① 规模
title(0.06, 0.885, '① 规模：17 集，一帧不漏')
fig.text(0.06, 0.832, f'{FRAMES:,}', fontsize=30, fontweight='bold', color=BLUE, va='center')
fig.text(0.192, 0.829, '帧', fontsize=18, fontweight='bold', color=BLUE, va='center')
fig.text(0.245, 0.842, '倪师《天纪》紫微 17 集逐帧解码', fontsize=10, color=MUTED, va='center')
fig.text(0.245, 0.820, '每帧有 sha256 清单，不抽帧', fontsize=10, color=MUTED, va='center')
ax = fig.add_axes([0.17, 0.635, 0.31, 0.15])
rows = [('逐帧层窗数\n每窗 12 帧', WIN_PILOT, WIN_FULL, '窗'), ('集数', 2, 17, '集')]
for i, (lab, a, b, u) in enumerate(rows):
    y = 1 - i
    ax.barh(y + 0.18, a / b, height=0.32, color=GREY)
    ax.barh(y - 0.18, 1, height=0.32, color=BLUE)
    ax.text(a / b + 0.02, y + 0.18, f'{a:,} {u}', va='center', fontsize=10, color=MUTED)
    ax.text(1.02, y - 0.18, f'{b:,} {u}', va='center', fontsize=10.5, color=BLUE, fontweight='bold')
ax.set_yticks([1, 0]); ax.set_yticklabels([r[0] for r in rows], fontsize=11, color=INK)
ax.set_xlim(0, 1.32); ax.set_ylim(-0.55, 1.55); ax.set_xticks([]); clean(ax)
fig.text(0.17, 0.612, '灰：试点两集（P17 + P05）    蓝：全量 17 集，11-13 全部跑满', fontsize=9.6, color=MUTED, va='center')

# ② 笔记
title(0.56, 0.885, '② 17 集康奈尔笔记')
for x, num, unit in ((0.56, f'{CUES:,}', '个提示'), (0.745, f'{NOTES:,}', '条笔记')):
    fig.text(x, 0.832, num, fontsize=27, fontweight='bold', color=BLUE, va='center')
    fig.text(x + 0.075, 0.826, unit, fontsize=12, color=INK, va='center')
fig.text(0.56, 0.787, '每条标依据：口述 / 叠图 / 板书 / 指代 / 推断，带时间码与帧号', fontsize=10, color=MUTED, va='center')
ax = fig.add_axes([0.56, 0.69, 0.37, 0.042])
ax.barh(0, QUOTES_HIT, height=1, color=BLUE)
ax.barh(0, QUOTES - QUOTES_HIT, left=QUOTES_HIT, height=1, color=GREY)
ax.text(QUOTES * 0.015, 0, f'字幕里原字找到 {QUOTES_HIT:,} 段', va='center', fontsize=10.5, color='white', fontweight='bold')
ax.set_xlim(0, QUOTES); ax.set_ylim(-0.5, 0.5); ax.axis('off')
fig.text(0.56, 0.750, f'口述里引的倪师原话 {QUOTES:,} 段', fontsize=12, fontweight='bold', color=INK, va='center')
fig.text(0.56, 0.672, '剩 1 段只在语音里，已注明', fontsize=9.6, color=MUTED, va='center')
fig.text(0.56, 0.636, '待核', fontsize=10.5, color='white', fontweight='bold', va='center',
         bbox=dict(boxstyle='round,pad=0.25', fc=ORANGE, ec='none'))
fig.text(0.605, 0.636, f'拿不准的 {TODO:,} 处单列，不混进正文', fontsize=11.5, fontweight='bold', color=INK, va='center')
fig.text(0.605, 0.610, '笔记正文在私有仓库；公开的是摘要（见 ④）', fontsize=9.6, color=MUTED, va='center')

# ③ 指代与片源上限
title(0.06, 0.548, '③ 指代与片源上限：视频本身给不出的')
fig.text(0.06, 0.513, '指代：「这里 / 这个」出题 2,805 道，Claude 看原帧逐题盲标，全部标完', fontsize=10.2, color=MUTED, va='center')
ax = fig.add_axes([0.205, 0.335, 0.41, 0.16])
bars = [('「这里 / 这个」\n2,805 题 · 全量', [(816, BLUE, '真在指 29.1%'), (798, LIGHT, '口头用法 28.4%'), (1191, GREY, '看不出或拿不准 42.5%')]),
        ('粉笔板书\n228 字位 · 小考样本', [(82, BLUE, '认得出 36%'), (146, GREY, '认不出 64%')]),
        ('电子叠图时长\n53,491 秒 · 全量', [(15586, BLUE, '有叠图 29.1%'), (53491 - 15586, GREY, '没有叠图 70.9%')])]
for i, (lab, segs) in enumerate(bars):
    y = 2 - i
    tot = sum(s[0] for s in segs)
    left = 0
    for n, col, txt in segs:
        w = n / tot
        ax.barh(y, w, left=left, height=0.58, color=col)
        ax.text(left + 0.012, y, txt, va='center', fontsize=9.2, fontweight='bold', color='white' if col == BLUE else INK)
        left += w
ax.set_yticks([2, 1, 0]); ax.set_yticklabels([b[0] for b in bars], fontsize=9.8, color=INK)
ax.set_xlim(0, 1); ax.set_ylim(-0.45, 2.45); ax.set_xticks([]); clean(ax); ax.spines['bottom'].set_visible(False)
fig.text(0.205, 0.318, '灰：看不出 / 认不出 / 没有。如实写明，不按紫微知识补', fontsize=9.6, color=MUTED, va='center')

# ④ 公开摘要
title(0.685, 0.548, '④ 公开摘要 344 条要点')
ax = fig.add_axes([0.725, 0.165, 0.22, 0.355])
mx = max(n for _, n in SUMMARY)
for i, (ep, n) in enumerate(SUMMARY):
    y = len(SUMMARY) - 1 - i
    ax.barh(y, n / mx, height=0.64, color=BLUE)
    ax.text(n / mx + 0.03, y, f'{n}', va='center', fontsize=9, color=MUTED)
ax.set_yticks(range(len(SUMMARY))); ax.set_yticklabels([s[0] for s in SUMMARY][::-1], fontsize=9.4, color=INK)
ax.set_xlim(0, 1.25); ax.set_ylim(-0.7, len(SUMMARY) - 0.3); ax.set_xticks([]); clean(ax)
fig.text(0.685, 0.135, '17 集每集一份，每条附时间码', fontsize=9.6, color=INK, va='center')
fig.text(0.685, 0.112, '点开跳到 B 站那一秒；原话只引短句', fontsize=9.6, color=MUTED, va='center')

# ⑤ 目录入口
title(0.06, 0.262, '⑤ 目录入口：research/nishi-video-reading/')
entries = [('README.md', '为什么做、怎么做（流程图）、片源上限、进度'),
           ('summaries/', '17 集公开摘要（344 条要点）'),
           ('docs/工作记录.md', '按时间的全过程：每个数字的出处、走过的弯路'),
           ('docs/', '方案与两轮独立终审、小考五个实验、叠图定稿说明'),
           ('scripts/  prompts/', '全部脚本与提示词：逐帧层调度、按句拼接、校验渲染')]
for i, (k, v) in enumerate(entries):
    y = 0.222 - i * 0.03
    fig.text(0.075, y, k, fontsize=10.8, color=BLUE, fontweight='bold', va='center')
    fig.text(0.245, y, v, fontsize=10.2, color=INK, va='center')

# 底部边界条
ax = fig.add_axes([0.06, 0.022, 0.89, 0.048]); ax.set_xticks([]); ax.set_yticks([])
for s in ax.spines.values():
    s.set_color(GREY)
ax.set_facecolor('#f6f7f8')
ax.text(0.5, 0.5, '边界守住：不含视频画面与帧图片  ·  不含讲课原话整段转写  ·  笔记正文在私有仓库  ·  引用的倪师原话不在授权内',
        ha='center', va='center', fontsize=11, color=INK)

fig.savefig(sys.argv[1], dpi=160, facecolor='white')
print('ok', sys.argv[1])

"""本轮更新总览图（2026-11-12）。用法：python update_20261112.py <输出.png>
样式同 update_20261108.py：宋体，改前灰 #c8ced6 / 改后蓝 #2a7ad5，五格 + 底部边界条。
宋体缺 ✓ ✗ ¥ 等字形，图里一律用文字代替。数字全部来自 docs/工作记录.md 与 README「片源上限」的实跑统计：
- 逐帧层窗数：full_status.py 的计数（试点 P17、P05 + 全量 15 集，每窗 12 帧）；
- 笔记：各集运行记录的「规模」「校验」两行（17 集）；
- 指代：17 集全部盲标结果（2,805 道题）；板书：小考样本 228 个字位；叠图：17 集每秒 1 帧打分。
"""
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager

font_manager.fontManager.addfont('/System/Library/Fonts/Supplemental/Songti.ttc')
plt.rcParams['font.family'] = 'Songti SC'
GREY, BLUE, LIGHT, INK, MUTED, GREEN, RED, ORANGE = '#c8ced6', '#2a7ad5', '#8fb8e8', '#1d2320', '#6b7570', '#2f7a55', '#b23a2e', '#b06a12'

# ---- 快照（数字截至 SNAP_TIME）----
SNAP_TIME = '11-13 14:21'
WIN_TOTAL = 133731                   # 17 集总窗数
WIN_BEFORE = 16874                   # 11-11 收工时：P17 8,133 + P05 8,741
WIN_NOW = 133731                     # 11-13 13:48 全部跑满
Q_TOTAL, Q_BEFORE = 2805, 297        # 指代题：17 集共 2,805 道；11-11 时只有试点 P17 163 + P05 134
NOTES = [  # 集, 提示, 条, 是否混合内容集（只写紫微部分）
    ('P01', 16, 62, True), ('P03', 137, 488, False), ('P05', 122, 430, False), ('P07', 124, 415, False),
    ('P09', 139, 495, False), ('P11', 125, 489, False), ('P13', 140, 513, False), ('P15', 117, 450, False),
    ('P17', 118, 468, False), ('P19', 126, 480, False), ('P21', 105, 412, False), ('P23', 103, 402, False),
    ('P25', 90, 315, True), ('P27', 104, 375, False), ('P29', 116, 424, False), ('P37', 29, 117, True),
    ('P48', 23, 78, True)]

fig = plt.figure(figsize=(12, 12.6), dpi=160)
fig.patch.set_facecolor('white')
fig.text(0.5, 0.968, '公开仓 nishi-ziwei-video-reading  ·  本轮更新', ha='center', fontsize=21, fontweight='bold', color=INK)
fig.text(0.5, 0.947, f'2026-11-12（数字截至 {SNAP_TIME}）  ·  全量 17 集：逐帧层跑批 → 本机预处理 → Claude 看原帧盲标 → 按句拼接 → 康奈尔笔记',
         ha='center', fontsize=10.5, color=MUTED)


def panel_title(ax, s):
    ax.set_title(s, loc='left', fontsize=14, fontweight='bold', color=INK, pad=10)


def clean(ax):
    for s in ('top', 'right', 'left'):
        ax.spines[s].set_visible(False)
    ax.tick_params(left=False, colors=MUTED)


# ① 全量进度 11-11 → 11-13
ax = fig.add_axes([0.19, 0.69, 0.28, 0.21])
panel_title(ax, '① 全量进度  11-11 → 本轮')
rows = [('逐帧层已跑窗', WIN_BEFORE, WIN_NOW, WIN_TOTAL, '窗'),
        ('指代盲标题', Q_BEFORE, Q_TOTAL, Q_TOTAL, '题'),
        ('康奈尔笔记', 2, len(NOTES), 17, '集')]
for i, (lab, a, b, tot, u) in enumerate(rows):
    y = 2 - i
    ax.barh(y + 0.17, a / tot, height=0.3, color=GREY)
    ax.barh(y - 0.17, b / tot, height=0.3, color=BLUE)
    ax.text(a / tot + 0.015, y + 0.17, f'{a:,}', va='center', fontsize=9.5, color=MUTED)
    ax.text(b / tot + 0.015, y - 0.17, f'{b:,}', va='center', fontsize=9.5, color=BLUE, fontweight='bold')
ax.set_yticks([2, 1, 0]); ax.set_yticklabels([f'{r[0]}\n共 {r[3]:,} {r[4]}' for r in rows], fontsize=10.5, color=INK)
ax.set_xlim(0, 1.25); ax.set_ylim(-1.05, 2.55); ax.set_xticks([]); clean(ax)
ax.text(0, -0.6, '灰：11-11 收工时（只有试点两集）', color=MUTED, fontsize=9.5, va='center')
ax.text(0, -0.92, f'蓝：{SNAP_TIME}', color=BLUE, fontsize=9.5, va='center')

# ② 17 集笔记条数
ax = fig.add_axes([0.62, 0.52, 0.27, 0.38])
panel_title(ax, '② 17 集康奈尔笔记（条数）')
m = max(n[2] for n in NOTES)
for i, (ep, cue, cnt, mixed) in enumerate(NOTES):
    y = len(NOTES) - 1 - i
    ax.barh(y, cnt / m, height=0.62, color=LIGHT if mixed else BLUE)
    ax.text(cnt / m + 0.02, y, f'{cnt}  （{cue} 个提示）', va='center', fontsize=8.6, color=MUTED)
ax.set_yticks(range(len(NOTES))); ax.set_yticklabels([n[0] + (' *' if n[3] else '') for n in NOTES][::-1], fontsize=9.6, color=INK)
ax.set_xlim(0, 1.5); ax.set_ylim(-0.7, len(NOTES) - 0.4); ax.set_xticks([]); clean(ax)
ax.text(0, -2.0, '合计 1,734 个提示、6,413 条笔记；17 集全部出稿', fontsize=9.5, color=INK)
ax.text(0, -3.0, '* 浅蓝：混合内容集，只写紫微部分，其余写跳过说明', fontsize=9.2, color=MUTED)

# ③ 程序逐条核对
ax = fig.add_axes([0.07, 0.34, 0.45, 0.27]); ax.axis('off')
panel_title(ax, '③ 不靠模型自述：程序逐条核对')
items = [('引文', GREEN, '口述里引的原话 14,825 段', '去掉标点后必须在所引帧附近的字幕里原字找到：14,824 段找到，1 段只在语音里（已注明）'),
         ('板书', GREEN, '板书条', '每条都要落在本块的板书图清单里；跨两张图的拆成两条'),
         ('指代', GREEN, '指代条', '每条都要有一道 Claude 盲标为「是 + 确定」的题作依据'),
         ('待核', ORANGE, '拿不准的 2,613 处', '听不清、两路对不上、认不出的，单列待核，不混进正文')]
for i, (mk, col, head, body) in enumerate(items):
    y = 0.88 - i * 0.235
    ax.text(0.0, y + 0.045, mk, fontsize=10.5, color='white', fontweight='bold', va='center', bbox=dict(boxstyle='round,pad=0.25', fc=col, ec='none'))
    ax.text(0.11, y + 0.045, head, fontsize=12, color=INK, fontweight='bold', va='center')
    ax.text(0.11, y - 0.05, body, fontsize=9.4, color=MUTED, va='center')
ax.set_xlim(0, 1); ax.set_ylim(0, 1)

# ④ 片源上限
ax = fig.add_axes([0.6, 0.2, 0.35, 0.22])
panel_title(ax, '④ 片源上限：视频本身给不出的')
bars = [('「这里 / 这个」\n2,805 题 · 全量', [(816, BLUE, '真在指 29.1%'), (798, LIGHT, '口头用法 28.4%'), (1191, GREY, '看不出或拿不准 42.5%')]),
        ('粉笔板书\n228 字位 · 小考样本', [(82, BLUE, '认得出 36%'), (146, GREY, '认不出 64%')]),
        ('电子叠图时长\n53,491 秒 · 全量', [(15586, BLUE, '有叠图 29.1%'), (53491 - 15586, GREY, '没有叠图 70.9%')])]
for i, (lab, segs) in enumerate(bars):
    y = 2 - i
    tot = sum(s[0] for s in segs)
    left = 0
    for n, col, txt in segs:
        w = n / tot
        ax.barh(y, w, left=left, height=0.56, color=col)
        ax.text(left + 0.012, y, txt, va='center', fontsize=8.8, fontweight='bold', color='white' if col == BLUE else INK)
        left += w
ax.set_yticks([2, 1, 0]); ax.set_yticklabels([b[0] for b in bars], fontsize=9.6, color=INK)
ax.set_xlim(0, 1); ax.set_ylim(-0.75, 2.45); ax.set_xticks([]); clean(ax); ax.spines['bottom'].set_visible(False)
ax.text(0, -0.62, '灰：看不出 / 认不出 / 没有。如实写进交付，不按紫微知识补', fontsize=9.2, color=MUTED)

# ⑤ 跑批经验
ax = fig.add_axes([0.07, 0.1, 0.45, 0.2]); ax.axis('off')
panel_title(ax, '⑤ 跑批的几条经验')
lessons = [('并发不是越高越快', '300 路约 115 窗/分，不比 160 路约 119 窗/分快'),
           ('上行带宽会成瓶颈', '上行约 24 Mbps 时 160 路降到 32 路速度不变（约 19 窗/分）；回原网络约 187 窗/分'),
           ('扣费晚到会误停', '单价闸门起判点 200 → 2,000 窗（P07、P09 曾各被误停在 359 窗）'),
           ('失败窗补齐', '试点两集最后 1 窗 11-12 补齐，全量最后 14 窗 11-13 补齐；只差零星几窗时先出笔记，差几窗写明')]
for i, (k, v) in enumerate(lessons):
    y = 0.86 - i * 0.25
    ax.text(0.0, y + 0.04, k, fontsize=11.5, color=INK, fontweight='bold', va='center')
    ax.text(0.0, y - 0.07, v, fontsize=9.4, color=MUTED, va='center')
ax.set_xlim(0, 1); ax.set_ylim(0, 1)

# 底部边界条
ax = fig.add_axes([0.07, 0.022, 0.88, 0.05]); ax.set_xticks([]); ax.set_yticks([])
for s in ax.spines.values():
    s.set_color(GREY)
ax.set_facecolor('#f6f7f8')
ax.text(0.5, 0.5, '边界守住：不含视频画面与帧图片  ·  不含讲课原话整段转写  ·  笔记正文在私有仓库  ·  钥匙与账号不入仓',
        ha='center', va='center', fontsize=11, color=INK)

fig.savefig(sys.argv[1], dpi=160, facecolor='white')
print('ok', sys.argv[1])

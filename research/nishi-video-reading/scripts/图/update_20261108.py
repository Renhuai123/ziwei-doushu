"""本轮更新总览图（2026-11-08）。用法：python update_20261108.py <输出.png>
样式同姊妹仓 ziwei-doushu：宋体，改前灰 #c8ced6 / 改后蓝 #2a7ad5，五格 + 底部边界条。数字全部来自 docs/工作记录.md 的实跑结果。
"""
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager

font_manager.fontManager.addfont('/System/Library/Fonts/Supplemental/Songti.ttc')
plt.rcParams['font.family'] = 'Songti SC'
GREY, BLUE, INK, MUTED, GREEN, RED, ORANGE = '#c8ced6', '#2a7ad5', '#1d2320', '#6b7570', '#2f7a55', '#b23a2e', '#b06a12'

fig = plt.figure(figsize=(12, 10.6), dpi=160)
fig.patch.set_facecolor('white')
fig.text(0.5, 0.965, '公开仓 nishi-ziwei-video-reading  ·  本轮更新', ha='center', fontsize=21, fontweight='bold', color=INK)
fig.text(0.5, 0.94, '2026-11-08  ·  第一次公开  ·  方案定稿 → 小考五个实验 → 电子叠图两遍转写 + 裁定 → 苹果识别交叉核对', ha='center', fontsize=10.5, color=MUTED)


def panel_title(ax, s):
    ax.set_title(s, loc='left', fontsize=14, fontweight='bold', color=INK, pad=10)


def clean(ax):
    for s in ('top', 'right', 'left'):
        ax.spines[s].set_visible(False)
    ax.tick_params(left=False, colors=MUTED)


# ① 叠图定稿 第一版 → 第二版
ax = fig.add_axes([0.17, 0.6, 0.3, 0.29])
panel_title(ax, '① 电子叠图定稿  第一版 → 第二版')
rows = [('叠图状态（去重后）', 1580, 1726, '1,580', '1,726'), ('定稿字数（万）', 14.1, 16.3, '14.1 万', '16.3 万')]
for i, (lab, a, b, ta, tb) in enumerate(rows):
    y = 1 - i
    m = max(a, b)
    ax.barh(y + 0.17, a / m, height=0.3, color=GREY)
    ax.barh(y - 0.17, b / m, height=0.3, color=BLUE)
    ax.text(a / m + 0.01, y + 0.17, ta, va='center', fontsize=10, color=MUTED)
    ax.text(b / m + 0.01, y - 0.17, tb, va='center', fontsize=10, color=BLUE)
    ax.text(1.32, y, f'+{(b - a) / a:.0%}', va='center', ha='right', fontsize=12, color=GREEN)
ax.set_yticks([1, 0]); ax.set_yticklabels([r[0] for r in rows], fontsize=11, color=INK)
ax.set_xlim(0, 1.34); ax.set_ylim(-0.9, 1.6); ax.set_xticks([]); clean(ax)
ax.text(0, -0.45, '灰：第一版（两遍转写 + 裁定）', color=MUTED, fontsize=9.5, va='center')
ax.text(0, -0.75, '蓝：第二版（交叉核对后修正）', color=BLUE, fontsize=9.5, va='center')

# ② 逐张看原图发现的问题
ax = fig.add_axes([0.62, 0.6, 0.33, 0.29])
panel_title(ax, '② 交叉核对后，逐张看原图')
rows = [('整张 12 宫大盘', 108, 75, '有漏错'), ('苹果识别标出', 122, 100, '有漏错'), ('疑似误判重复', 255, 93, '其实不同'), ('状态中途有变化', 322, 47, '字变了')]
for i, (lab, tot, bad, word) in enumerate(rows):
    y = 3 - i
    ax.barh(y, bad / tot, height=0.5, color=BLUE)
    ax.barh(y, 1 - bad / tot, left=bad / tot, height=0.5, color=GREY)
    short = bad / tot < 0.25  # 蓝条太短时字放到条外、用深色
    ax.text(bad / tot + 0.02 if short else 0.02, y, f'{bad} {word}', va='center', color=BLUE if short else 'white', fontsize=10.5, fontweight='bold')
    ax.text(1.02, y, f'共 {tot}', va='center', fontsize=10, color=MUTED)
ax.set_yticks([3, 2, 1, 0]); ax.set_yticklabels([r[0] for r in rows], fontsize=11, color=INK)
ax.set_xlim(0, 1.18); ax.set_xticks([]); clean(ax)
ax.text(0, -0.85, '大盘 69% 有漏错：同一模型两遍同漏，换技术核对才抓到', fontsize=9.5, color=MUTED)

# ③ 小考五层结论
ax = fig.add_axes([0.07, 0.13, 0.42, 0.37]); ax.axis('off')
panel_title(ax, '③ 小考：每一层先考再做')
items = [('过线', GREEN, '逐帧层（DeepSeek）', '提示词 v2 + 开思考：碰板 / 在写 ≥ 90%，换帧探针抓到 92%，误报 0'),
         ('做不到', RED, '粉笔板书逐字转写', '标准答案 228 个字位里 64% 连 Claude 都认不出 → 只录看得清的'),
         ('改法', ORANGE, '指代层（「这里」指哪）', 'Kimi 单独过不了「指错 ≤ 5%」→ Kimi 初判 + Claude 看原帧逐条复核'),
         ('第三票', ORANGE, 'Grok 裁决', '79%（门槛 80%），约 63 题 / 小时 → 只当第三票'),
         ('过线', GREEN, '电子叠图', '两遍独立转写 → 比对 → 看原图裁定 → 苹果识别交叉核对')]
for i, (mk, col, head, body) in enumerate(items):
    y = 0.9 - i * 0.2
    ax.text(0.0, y + 0.04, mk, fontsize=10.5, color='white', fontweight='bold', va='center', bbox=dict(boxstyle='round,pad=0.25', fc=col, ec='none'))
    ax.text(0.13, y + 0.04, head, fontsize=12, color=INK, fontweight='bold', va='center')
    ax.text(0.13, y - 0.045, body, fontsize=9.6, color=MUTED, va='center')
ax.set_xlim(0, 1); ax.set_ylim(0, 1)

# ④ 叠图在片中占多少
ax = fig.add_axes([0.56, 0.4, 0.39, 0.1])
panel_title(ax, '④ 电子叠图占全片时长')
ax.barh(0, 15586 / 53491, color=BLUE, height=0.6)
ax.barh(0, 1 - 15586 / 53491, left=15586 / 53491, color=GREY, height=0.6)
ax.text(0.01, 0, '有叠图 29.1%', va='center', color='white', fontsize=10.5, fontweight='bold')
ax.text(0.99, 0, '15,586 / 53,491 秒', va='center', ha='right', color=INK, fontsize=10)
ax.set_xlim(0, 1); ax.set_ylim(-1.1, 0.5); ax.set_yticks([]); ax.set_xticks([]); clean(ax); ax.spines['bottom'].set_visible(False)
ax.text(0, -0.85, '3 集完全没有叠图：那里只能靠口述和看得清的粉笔字', fontsize=9.5, color=MUTED)

# ⑤ 花费
ax = fig.add_axes([0.56, 0.13, 0.39, 0.17]); ax.axis('off')
panel_title(ax, '⑤ 花了多少')
costs = [('小考五个实验（DeepSeek + Kimi）', '115 元'), ('指代层重测（Kimi）', '31 元'), ('叠图两遍转写 + 裁定（Claude 接口）', '约 $171'), ('复核、裁定（Opus 子代理）', '不另花钱')]
for i, (k, v) in enumerate(costs):
    y = 0.85 - i * 0.26
    ax.text(0.0, y, k, fontsize=10.5, color=INK, va='center')
    ax.text(1.0, y, v, fontsize=11.5, color=BLUE, va='center', ha='right', fontweight='bold')
ax.set_xlim(0, 1); ax.set_ylim(0, 1)

# 底部边界条
ax = fig.add_axes([0.07, 0.025, 0.88, 0.055]); ax.set_xticks([]); ax.set_yticks([])
for s in ax.spines.values():
    s.set_color(GREY)
ax.set_facecolor('#f6f7f8')
ax.text(0.5, 0.5, '边界守住：不含视频画面与帧图片  ·  不含讲课原话整段转写  ·  不公开反推的命例生辰  ·  钥匙与账号不入仓',
        ha='center', va='center', fontsize=11, color=INK)

fig.savefig(sys.argv[1], dpi=160, facecolor='white')
print('ok', sys.argv[1])

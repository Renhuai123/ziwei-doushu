"""叠图打分：从上到下大片连续的白色竖条（或从左到右的白色横条）。

白 = RGB 三通道最小值 > 200 且通道差 < 30。只看画面上部 85%（避开底部字幕）。
分数 = 白色占比 > 0.55 的最长连续列（或行）占画面宽（或高）的比例，取两者较大。
衬衫上方是深色黑板，整列白不起来；电子命盘是整列白。阈值只用于分层抽样，不作为任何结论。
"""
import numpy as np

def score(rgb):
    h = rgb.shape[0]
    a = rgb[: int(h * 0.85)].astype(np.int16)
    mn, mx = a.min(2), a.max(2)
    white = (mn > 200) & (mx - mn < 30)
    def run(frac):
        best = cur = 0
        for v in frac > 0.55:
            cur = cur + 1 if v else 0
            best = max(best, cur)
        return best / len(frac)
    return max(run(white.mean(0)), run(white.mean(1)))

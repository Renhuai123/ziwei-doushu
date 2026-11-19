"""叠图打分 v2：白色且接近矩形的块（电子命盘、宫位小格、卦表）占画面的比例。

白 = 三通道最小值 > 190 且通道差 < 40；只看上部 85%（避开字幕）。先 5×5 闭运算填平格内文字，
再取连通块：面积 ≥ 画面 0.4%、且「面积 / 外接矩形面积」≥ 0.8 的块算叠图。衬衫形状不规则，过不了矩形这一关。
分数只用于分层抽样，不作结论。
"""
import cv2
import numpy as np

def score(rgb):
    h = rgb.shape[0]
    a = rgb[: int(h * 0.85)].astype(np.int16)
    mn, mx = a.min(2), a.max(2)
    white = ((mn > 190) & (mx - mn < 40)).astype(np.uint8)
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, 8)
    total = white.size
    keep = 0
    for i in range(1, n):
        x, y, w, hh, area = st[i]
        if area >= 0.004 * total and area / (w * hh) >= 0.8:
            keep += area
    return keep / total

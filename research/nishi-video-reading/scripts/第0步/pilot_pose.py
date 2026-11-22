"""试点：整集逐帧姿态与遮挡（程序算，逐帧层的「遮挡」和指代层的「指尖」都从这里取）。
用法：python pilot_pose.py P17 起帧 止帧 分片名

与第 0 步 segment.py 同一套参数和算法（PARAMS 原样导入）：MediaPipe 人体姿态（960 宽）→ 左右手指尖 / 腕坐标与可见度、
九宫格人体遮挡比例（上部 85%，避开字幕）、九宫格是否有新笔画（掩膜外灰度变化）、是否切镜头。
不同点：整集分片跑、不落帧图（20 万张太大，用到时按帧号重解码）；板面稳定状态在合并时统一算（跨分片不断）。
每帧仍对腾讯云清单 sha256，不一致即停。
输出：第0步/姿态/<集>-<分片>.jsonl，每行 {f, 有人, 手, 遮挡[9], 变化格, 切镜头}
"""
import hashlib
import json
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np

_argv = sys.argv
sys.argv = sys.argv[:1]
from segment import BASE, LM, PARAMS, cells_of, frames, manifest   # noqa: E402
sys.argv = _argv

ROOT = Path(__file__).resolve().parent
EP, A, B, TAG = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
OUT = ROOT / '姿态'
OUT.mkdir(exist_ok=True)


def main():
    man = manifest(EP)
    B2 = min(B, max(man))
    n = B2 - A + 1
    fps = 30
    opts = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(BASE / '模型' / 'mediapipe' / 'pose_landmarker_full.task')),
        running_mode=mp.tasks.vision.RunningMode.VIDEO, num_poses=1, min_pose_detection_confidence=.35,
        min_pose_presence_confidence=.35, min_tracking_confidence=.35, output_segmentation_masks=True)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * PARAMS['maskDilatePx'] + 1,) * 2)
    outp = OUT / f'{EP}-{TAG}.jsonl'
    prev = None
    count = 0
    with mp.tasks.vision.PoseLandmarker.create_from_options(opts) as det, outp.open('w') as log:
        for idx, jpg in frames(EP, A, n):
            if hashlib.sha256(jpg).hexdigest() != man[idx]:
                raise SystemExit(f'{EP} 第 {idx} 帧与云端清单不一致，停止')
            img = cv2.imdecode(np.frombuffer(jpg, np.uint8), cv2.IMREAD_COLOR)
            H, W = img.shape[:2]
            ph = round(H * PARAMS['poseWidth'] / W)
            small = cv2.resize(img, (PARAMS['poseWidth'], ph), interpolation=cv2.INTER_AREA)
            res = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(small, cv2.COLOR_BGR2RGB)),
                                       round((idx - A) * 1000 / fps))
            dw = PARAMS['diffWidth']; dh = round(H * dw / W); band = int(dh * PARAMS['subtitleBand'])
            gray = cv2.cvtColor(cv2.resize(img, (dw, dh), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)[:band].astype(np.int16)
            mask = np.zeros((band, dw), np.uint8)
            hands = {}
            if res.pose_landmarks:
                if res.segmentation_masks:
                    m = cv2.resize(res.segmentation_masks[0].numpy_view(), (dw, dh))[:band]
                    mask = cv2.dilate((m > PARAMS['maskThreshold']).astype(np.uint8), k)
                lm = res.pose_landmarks[0]
                for side, (wi, ti) in LM.items():
                    tip = lm[ti]
                    hands[side] = {'指尖': [round(tip.x * W, 1), round(tip.y * H, 1)], '腕': [round(lm[wi].x * W, 1), round(lm[wi].y * H, 1)],
                                   '可见度': round(tip.visibility, 3)}
            occ = cells_of(mask.astype(np.float32), band)
            changed, cut = [False] * 9, False
            if prev is not None:
                d = (np.abs(gray - prev) > PARAMS['pixelDiff'])
                cut = bool(d.mean() > PARAMS['sceneCutFraction'])
                d = d & (mask == 0)
                counts = cells_of(d.astype(np.float32), band)
                cell_px = (band // 3) * (dw // 3)
                changed = [bool(c * cell_px > PARAMS['changedPixelsPerCell']) for c in counts]
            prev = gray
            log.write(json.dumps({'f': idx, '有人': bool(res.pose_landmarks), '手': hands, '遮挡': [round(x, 3) for x in occ],
                                  '变化格': [c + 1 for c in range(9) if changed[c]], '切镜头': cut}, ensure_ascii=False) + '\n')
            count += 1
            if count % 5000 == 0:
                print(EP, TAG, count, '/', n, flush=True)
    if count != n:
        raise SystemExit(f'{EP} {TAG} 只解出 {count} 帧，应为 {n}')
    print(EP, TAG, '完成', count, flush=True)


if __name__ == '__main__':
    main()

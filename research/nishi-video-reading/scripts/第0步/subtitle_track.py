"""试点第一步：用苹果系统文字识别做一条字幕参照轨（只识别、存原始结果）。
用法：python subtitle_track.py P17 [起帧 止帧 分片名]

做法：ffmpeg 按帧号每 6 帧取 1 帧（每秒 5 帧，帧号 = 秒 × 30，两集逐帧时间戳已核对均匀），只裁画面底部字幕带（高度 74%–96%），交 vision_ocr 读字；
每个采样点把识别到的每一行连同位置框、可信度原样存下，不在这里过滤。
清洗（去叠图串入、去空格抖动、单帧误读平滑、并句）在 subtitle_clean.py 里做，规则可反复调，不必重识别。
第一版作废，病根：字幕带高度算成 237 行（奇数），ffmpeg 悄悄改成 236 行，脚本仍按 237 行读，
每帧错位一行、越往后越错——画面上下错开、字被切半读花，每 237 帧还吞掉一帧（3 分钟处时间早 0.8 秒、片尾少 69 个采样点）。
另外同一句因空格时有时无被拆成好几句、叠图字串进字幕，所以清洗单独做。
输出：倪师紫微视频精读/字幕/苹果识别/原始/<集>[-分片].jsonl，每行 {帧, 秒, 行:[{字, 可信, 框}]}；
框 = [x, y, w, h]，相对字幕带、原点在左下。
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
EP = sys.argv[1]
A = int(sys.argv[2]) if len(sys.argv) > 2 else 0
B = int(sys.argv[3]) if len(sys.argv) > 3 else 10 ** 9
STEP = 6
A = (A + STEP - 1) // STEP * STEP
TAG = sys.argv[4] if len(sys.argv) > 4 else ''
OUT = ROOT.parent / '字幕' / '苹果识别' / '原始'
OUT.mkdir(parents=True, exist_ok=True)
OCR = ROOT / 'vision_ocr' / 'vision_ocr'


def main():
    video = str(ROOT.parent / '视频' / f'{EP}.mp4')
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0',
                            video], capture_output=True, text=True).stdout.strip().split(',')
    w, h = int(probe[0]), int(probe[1])
    # 裁剪高度、起点必须是偶数：yuv420p 下 ffmpeg 会把奇数高度悄悄改成偶数，按原数读会每帧错位一行（第一版的真病根）
    y0 = int(h * 0.74) // 2 * 2
    y1 = y0 + (int(h * 0.96) - y0) // 2 * 2
    sel = f"select='between(n\\,{A}\\,{B})*not(mod(n\\,{STEP}))',crop={w}:{y1 - y0}:0:{y0}"
    cmd = ['ffmpeg', '-v', 'error', '-i', video, '-an', '-vf', sel, '-fps_mode', 'passthrough',
           '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-']
    # 第 k 个输出帧的帧号 = A + 6k；不靠时间戳取帧，杜绝漂移
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = w * (y1 - y0) * 3
    tmp = Path(tempfile.mkdtemp(prefix=f'sub_{EP}{TAG}_'))
    out = (OUT / f'{EP}{"-" + TAG if TAG else ""}.jsonl').open('w')
    i = 0
    batch = []

    def flush():
        if not batch:
            return
        res = {}
        for line in subprocess.run([str(OCR), *[b[1] for b in batch]], capture_output=True, text=True).stdout.splitlines():
            r = json.loads(line)
            res[r['图']] = r['行']
        for t, path in batch:
            out.write(json.dumps({'帧': t, '秒': round(t / 30, 2), '行': res.get(path, [])}, ensure_ascii=False) + '\n')
            Path(path).unlink(missing_ok=True)
        out.flush()
        batch.clear()

    while True:
        b = p.stdout.read(size)
        if len(b) < size:
            if b:
                raise SystemExit(f'{EP}{TAG} 帧大小对不上：末尾剩 {len(b)} 字节，每帧应为 {size}')
            break
        img = np.frombuffer(b, np.uint8).reshape(y1 - y0, w, 3)
        path = str(tmp / f'{i:07d}.png')
        cv2.imwrite(path, img)
        batch.append((A + i * STEP, path))
        i += 1
        if len(batch) >= 300:
            flush()
            print(EP, TAG, f'{(A + i * STEP) / 30 / 60:.1f} 分钟', flush=True)
    flush()
    p.wait()
    out.close()
    print(EP, TAG, '完成 采样', i, flush=True)


if __name__ == '__main__':
    main()

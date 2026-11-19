"""全 17 集每秒 1 帧叠图打分（v2：白色矩形块）→ 叠图扫描v2/Pxx.tsv（秒, 分数）。用法：python scan_overlay.py P25"""
import subprocess, sys
from pathlib import Path
import numpy as np
from overlay2 import score
ep = sys.argv[1]
root = Path(__file__).resolve().parent
out = root / '叠图扫描v2' / f'{ep}.tsv'; out.parent.mkdir(exist_ok=True)
W, H = 405, 270
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-threads', '2', '-i', str(root.parent / '视频' / f'{ep}.mp4'), '-an',
                      '-vf', f'fps=1,scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
rows = []; s = 0
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    rows.append(f'{s}\t{score(np.frombuffer(b, np.uint8).reshape(H, W, 3)):.3f}\n'); s += 1
p.wait()
out.write_text(''.join(rows))
print(ep, s, '秒')

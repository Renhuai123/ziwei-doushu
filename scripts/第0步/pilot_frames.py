"""试点逐帧层（DeepSeek，提示词 v2 + 开思考）。用法：
  python pilot_frames.py P17 [起窗 止窗] [--并发 32] [--名 试点]
窗 = 连续 12 帧，第 w 窗 = 帧 12w … 12w+11（全片无缝覆盖，最后一窗可能不足 12 帧）。不给起止窗就跑整集。

- 取帧：与全帧上传同一条解码命令（segment.frames），每帧对腾讯云清单 sha256，不一致即停。
- 出图：与小考 build_windows 相同——原分辨率，上方 44 像素黑条烧「#序号  frame 帧号」，JPG 质量 95。
- 调用：同小考 run_frames（deepseek-flash，开思考，max_tokens 16000，提示词 逐帧提示词-v2.md 原文，按张数改写）；
  格式不对重发一次；网络 / 限流退避重试。
- 落盘：每窗一完成就追加写入 逐帧层/<名>/<集>.jsonl；重跑时跳过已成功的窗（断点续跑）。
- --夜间：只在北京时间 00:35–08:20 发新请求（DeepSeek 非高峰半价；11-09 校准批按 token 倒算，白天价正好是
  输入 ¥2 / 输出 ¥8 每百万），过点停止派新窗，已发出的等它回来再退出；第二晚同一命令接着跑。
- --预算 N：每 50 窗查一次余额，本次运行累计扣费超过 N 元即停。
- --单价上限 X：跑满 2000 窗后每窗扣费超过 X 元即停（防夜间半价没生效；夜间价每窗约 ¥0.027，白天约 ¥0.055）。
  余额是整个账号的，同一时间只能跑一个进程，否则单价会算重。
"""
import base64
import hashlib
import json
import queue
import sys
import threading
import time
import urllib.request
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2
import numpy as np

sys.argv, _argv = sys.argv[:1], sys.argv          # segment.py 在导入时不读参数，这里先藏起来再取回
from segment import frames, manifest              # noqa: E402
import run_frames                                 # noqa: E402
from run_frames import call, parse, prompt_for    # noqa: E402
sys.argv = _argv

ROOT = Path(__file__).resolve().parent
run_frames.PROMPT = (ROOT / '逐帧提示词-v2.md').read_text()   # 导入时 argv 已藏起，须显式指定 v2
WIN = 12
BAND = 44


def burn(img, label):
    h, w = img.shape[:2]
    out = np.zeros((h + BAND, w, 3), np.uint8)
    out[BAND:] = img
    cv2.putText(out, label, (12, 32), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
    return out


KEYFILE = Path('~/.config/nishi-study/deepseek.key').expanduser()


def balance():
    req = urllib.request.Request('https://api.deepseek.com/user/balance',
                                 headers={'Authorization': 'Bearer ' + KEYFILE.read_text().strip()})
    with urllib.request.urlopen(req, timeout=30) as r:
        return float(json.load(r)['balance_infos'][0]['total_balance'])


def offpeak():
    t = datetime.now()
    m = t.hour * 60 + t.minute
    return 35 <= m < 8 * 60 + 20


def opt(name, default):
    if name in sys.argv:
        return sys.argv[sys.argv.index(name) + 1]
    return default


def main():
    ep = sys.argv[1]
    pos = [a for a in sys.argv[2:] if not a.startswith('--') and sys.argv[sys.argv.index(a) - 1] not in ('--并发', '--名', '--预算', '--单价上限')]
    night = '--夜间' in sys.argv
    budget = float(opt('--预算', 1e9))
    cap = float(opt('--单价上限', 1e9))
    man = manifest(ep)
    total = max(man) + 1
    nwin = (total + WIN - 1) // WIN
    w0 = int(pos[0]) if pos else 0
    w1 = int(pos[1]) if len(pos) > 1 else nwin - 1
    conc = int(opt('--并发', 32))
    name = opt('--名', '试点')
    outdir = ROOT / '逐帧层' / name
    outdir.mkdir(parents=True, exist_ok=True)
    outp = outdir / f'{ep}.jsonl'
    done = set()
    if outp.exists():
        for line in outp.open():
            r = json.loads(line)
            if r.get('行'):
                done.add(r['窗'])
    todo = [w for w in range(w0, w1 + 1) if w not in done]
    print(ep, f'窗 {w0}–{w1}，已完成 {len(done)}，待跑 {len(todo)}，并发 {conc}', flush=True)
    if not todo:
        return
    if night and not offpeak():
        print(ep, '现在不在夜间时段，不跑', flush=True)
        return
    lock = threading.Lock()
    stop = threading.Event()
    q = queue.Queue(maxsize=conc * 2)
    bal0 = balance()
    stats = {'窗': 0, '失败': 0, '输入': 0, '输出': 0, 't0': time.time()}
    print(ep, f'起始余额 ¥{bal0:.2f}，夜间限定 {night}，预算 {budget:g}', flush=True)

    def producer():
        todo_set = set(todo)
        start = todo[0] * WIN
        end = min((todo[-1] + 1) * WIN, total)
        cur, imgs = None, []
        for idx, jpg in frames(ep, start, end - start):
            if hashlib.sha256(jpg).hexdigest() != man[idx]:
                print(f'{ep} 帧 {idx} 与清单 sha256 不一致，停', flush=True)
                break
            w = idx // WIN
            if w not in todo_set:
                continue
            if stop.is_set():
                break
            if cur is not None and w != cur:
                while not stop.is_set():
                    try:
                        q.put((cur, imgs), timeout=5)
                        break
                    except queue.Full:
                        pass
                imgs = []
            cur = w
            img = cv2.imdecode(np.frombuffer(jpg, np.uint8), cv2.IMREAD_COLOR)
            k = idx - w * WIN
            ok, enc = cv2.imencode('.jpg', burn(img, f'#{k + 1:02d}  frame {idx}'), [cv2.IMWRITE_JPEG_QUALITY, 95])
            imgs.append((idx, enc.tobytes()))
        if imgs and not stop.is_set():
            q.put((cur, imgs))
        for _ in range(conc):
            try:
                q.put(None, timeout=5)
            except queue.Full:
                pass

    def worker():
        while True:
            if stop.is_set():
                return
            if night and not offpeak():
                if not stop.is_set():
                    print(ep, '到 08:20，停止派新窗', flush=True)
                stop.set()
                return
            try:
                item = q.get(timeout=5)
            except queue.Empty:
                if not th.is_alive():
                    return
                continue
            if item is None:
                return
            w, imgs = item
            n = len(imgs)
            content = [{'type': 'text', 'text': prompt_for(n)}]
            for _, b in imgs:
                content.append({'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,' + base64.b64encode(b).decode()}})
            t = time.time()
            out = {'窗': w, '帧': [i for i, _ in imgs]}
            d, text = None, ''
            try:
                for attempt in range(2):
                    d = call(content, True)
                    text = d['choices'][0]['message']['content'] or ''
                    try:
                        out.update({'行': parse(text, n), '格式失败': False})
                        break
                    except Exception as e:
                        out.update({'行': None, '格式失败': True, '解析错误': str(e)})
                out.update({'原始回答': text, 'usage': d['usage'], '秒': round(time.time() - t, 1), '重发': attempt})
            except Exception as e:
                out.update({'行': None, '调用失败': str(e)[:300], '秒': round(time.time() - t, 1)})
            with lock:
                with outp.open('a') as fh:
                    fh.write(json.dumps(out, ensure_ascii=False) + '\n')
                stats['窗'] += 1
                stats['失败'] += 0 if out.get('行') else 1
                if out.get('usage'):
                    stats['输入'] += out['usage']['prompt_tokens']
                    stats['输出'] += out['usage']['completion_tokens']
                if stats['窗'] % 50 == 0:
                    try:
                        spent = bal0 - balance()
                        print(f'{ep} 本次已扣 ¥{spent:.2f}（每窗 ¥{spent / stats["窗"]:.4f}）', flush=True)
                        if spent > budget:
                            print(ep, f'超出预算 ¥{budget:g}，停', flush=True)
                            stop.set()
                        if stats['窗'] >= 2000 and spent / stats['窗'] > cap:   # 11-12：200→2000，上一集扣费晚到 4–6 分钟会把刚开跑的一集算超价误停（P07、P09 各停在 359 窗）
                            print(ep, f'每窗 ¥{spent / stats["窗"]:.4f} 超过上限 ¥{cap:g}，停（夜间价可能没生效）', flush=True)
                            stop.set()
                    except Exception as e:
                        print(ep, '查余额失败', e, flush=True)
                if stats['窗'] % 20 == 0 or stats['窗'] == len(todo):
                    el = time.time() - stats['t0']
                    print(f"{ep} {stats['窗']}/{len(todo)} 窗，失败 {stats['失败']}，"
                          f"已用 {el / 60:.1f} 分钟，输入 {stats['输入']}，输出 {stats['输出']} token", flush=True)

    th = threading.Thread(target=producer, daemon=True)
    th.start()
    with ThreadPoolExecutor(conc) as ex:
        for _ in range(conc):
            ex.submit(worker)
    stop.set()
    th.join(timeout=30)
    try:
        print(ep, f'结束：本次跑 {stats["窗"]} 窗，余额 ¥{balance():.2f}', flush=True)
    except Exception:
        print(ep, f'结束：本次跑 {stats["窗"]} 窗', flush=True)


if __name__ == '__main__':
    main()

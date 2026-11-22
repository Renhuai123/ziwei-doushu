#!/bin/zsh
# 试点逐帧层夜跑（P17 → P05 依次，48 路并发）。等到北京时间 00:35 开跑，08:20 自动停派新窗；
# 没跑完的第二晚再执行本脚本即接着跑（逐窗断点续跑）。外面套 caffeinate 防止 Mac 睡眠。
# 单价闸：每窗 > ¥0.035 即停（夜间半价没生效时）；预算闸：每集 ¥350。
cd "$(dirname "$0")"
PY=../.venv-vision/bin/python
now=$(date +%s)
t=$(date -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 00:35:00" +%s)
[ $t -le $now ] && t=$((t + 86400))
echo "$(date '+%m-%d %H:%M') 等到 $(date -r $t '+%m-%d %H:%M') 开跑"
# ★ 11-10 改：按墙上时钟等。Mac 睡眠时 sleep 的倒计时会停住（11-10 傍晚合盖睡了约 51 分钟，会把 00:35 推迟到 01:26 左右），
#   所以每 30 秒看一次表，到点就跑；睡过多久都不影响。
while [ $(date +%s) -lt $t ]; do sleep 30; done
echo "$(date '+%m-%d %H:%M:%S') 到点，开跑"
for ep in P17 P05; do
  $PY pilot_frames.py $ep --并发 48 --名 试点 --夜间 --预算 350 --单价上限 0.035 2>&1 | grep -v "^W0000\|^I0000\|absl" >> 日志/逐帧-试点-$ep.log
done
echo "$(date '+%m-%d %H:%M') 夜跑结束" 
touch 逐帧层/试点/本夜结束.flag

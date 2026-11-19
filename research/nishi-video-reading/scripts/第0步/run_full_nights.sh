#!/bin/zsh
# 全量逐帧层多晚夜跑（2026-11-11 写，11-12 00:35 跑了第一晚；11-12 07:40 起改用 run_full_allday.sh，本脚本停用）。
# 每晚北京时间 00:35 开跑、08:20 停派新窗（DeepSeek 夜间半价）；没跑完的下一晚自动接着（逐窗断点续跑）。
# 每晚先补试点两集的失败窗（P17、P05），再按集号顺序跑其余 15 集，结果写 逐帧层/全量/<集>.jsonl。
# 并发：白天试跑 100 窗（120 路，0 失败、2.9 分钟）后定 160 路（每窗约 5 MB 图，160 路估约 8 MB/秒上行、留余量）。
#   每集开跑前读 夜跑并发.txt，改数不用重启。
# 闸：每晚开跑前、每集开跑前各过一次资金闸（见 funds_ok）；每集每晚预算、每窗扣费上限（夜间价没生效即停）由 pilot_frames.py 管。
# 全部跑完写 逐帧层/全量/全部完成.flag 并退出。外面要套 caffeinate -is（插电时防睡眠），见文末用法。
# 公开版说明：原版的资金闸查 DeepSeek 账户（每晚开跑前不足 300 元这一晚不跑，每集开跑前不足 50 元停这一晚）；
#   公开版把查账户换成空函数 funds_ok（总是放行），复现时自己实现。
cd "$(dirname "$0")"
PY=../.venv-vision/bin/python
LOG=日志/全量夜跑.log
EPS=(P01 P03 P07 P09 P11 P13 P15 P19 P21 P23 P25 P27 P29 P37 P48)
mkdir -p 日志 逐帧层/全量
say() { echo "$(date '+%m-%d %H:%M:%S') $*" >> $LOG; }
funds_ok() { return 0; }   # 公开版：资金闸留空，见文件头说明
next_0035() {
  local now=$(date +%s)
  local t=$(date -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 00:35:00" +%s)
  [ $t -le $now ] && t=$((t + 86400))
  echo $t
}
say "全量夜跑启动（PID $$）"
while true; do
  if $PY full_status.py >> $LOG 2>&1; then
    say "全部窗都已完成"; touch 逐帧层/全量/全部完成.flag; break
  fi
  t=$(next_0035)
  say "等到 $(date -r $t '+%m-%d %H:%M') 开跑"
  # 按墙上时钟等：Mac 睡眠时 sleep 倒计时会停，每 30 秒看一次表
  while [ $(date +%s) -lt $t ]; do sleep 30; done
  if ! funds_ok 300; then
    say "资金闸：账户不足 300 元，这一晚不跑"; sleep 600; continue
  fi
  say "到点，开跑"
  for ep in P17 P05; do
    $PY pilot_frames.py $ep --并发 48 --名 试点 --夜间 --预算 20 --单价上限 0.035 2>&1 | grep -v "^W0000\|^I0000\|absl" >> 日志/逐帧-试点-$ep.log
  done
  for ep in $EPS; do
    if ! funds_ok 50; then say "资金闸：账户不足 50 元，停这一晚"; break; fi
    CONC=$(cat 夜跑并发.txt 2>/dev/null | tr -cd '0-9'); CONC=${CONC:-120}
    $PY pilot_frames.py $ep --并发 $CONC --名 全量 --夜间 --预算 350 --单价上限 0.035 2>&1 | grep -v "^W0000\|^I0000\|absl" >> 日志/逐帧-全量-$ep.log
  done
  say "这一晚结束"
  sleep 600
done
say "全量夜跑退出"
# 用法：cd 第0步 && nohup caffeinate -is ./run_full_nights.sh >/dev/null 2>&1 &
# 停：kill 该进程（caffeinate 及其子进程一起）；看进度：../.venv-vision/bin/python full_status.py；日志 日志/全量夜跑.log

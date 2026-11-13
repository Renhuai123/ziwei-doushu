#!/bin/zsh
# 全量逐帧层「全天跑」（2026-11-12 07:40 起用，为赶进度不再只等夜间半价时段）。
# 取代只在夜里跑的 run_full_nights.sh（留作参考，已停用）。
# - 不再限夜间：日夜连续跑。DeepSeek 北京时间 00:30–08:30 自动半价，其余时间白天价。
# - 先补试点两集（P17、P05）的失败窗，再按集号顺序跑其余 15 集；逐窗断点续跑，结果写 逐帧层/全量/<集>.jsonl。
# - 并发：每集开跑前读 夜跑并发.txt（改数不用重启）。上行带宽吃满时把数改小。
# - 闸：每集开跑前过资金闸（见 funds_ok）；每集单次预算、每窗扣费上限（价格异常即停）由 pilot_frames.py 的 --预算、--单价上限 管。
# - 一整轮下来待跑数没减少（只剩反复失败的窗），等 30 分钟再试；连续 3 轮没进展就停，写日志等人看。
# - 全部跑完写 逐帧层/全量/全部完成.flag 并退出。日志 日志/全量夜跑.log（grep 逐行写，不再落后）。
# 用法：cd 第0步 && nohup caffeinate -is ./run_full_allday.sh >/dev/null 2>&1 &   （插电时防睡眠；别合盖）
# 公开版说明：原版的资金闸每集开跑前查一次 DeepSeek 账户，不足 100 元就每 10 分钟查一次、充值后自动接着跑；
#   公开版把查账户换成空函数 funds_ok（总是放行），复现时自己实现。
cd "$(dirname "$0")"
PY=../.venv-vision/bin/python
LOG=日志/全量夜跑.log
EPS=(P17 P05 P01 P03 P07 P09 P11 P13 P15 P19 P21 P23 P25 P27 P29 P37 P48)
mkdir -p 日志 逐帧层/全量
say() { echo "$(date '+%m-%d %H:%M:%S') $*" >> $LOG; }
funds_ok() { return 0; }   # 公开版：资金闸留空，见文件头说明
left_now() { $PY full_status.py 2>/dev/null | sed -n 's/^合计待跑 \([0-9]*\) 窗$/\1/p'; }

say "全天跑启动（PID $$，不限夜间）"
stuck=0
while true; do
  if $PY full_status.py >> $LOG 2>&1; then
    say "全部窗都已完成"; touch 逐帧层/全量/全部完成.flag; break
  fi
  before=$(left_now)
  for ep in $EPS; do
    until funds_ok 100; do
      say "资金闸：账户不足 100 元，等待（每 10 分钟查一次）"; sleep 600
    done
    if [ $ep = P17 ] || [ $ep = P05 ]; then
      $PY pilot_frames.py $ep --并发 48 --名 试点 --预算 40 --单价上限 0.07 2>&1 | grep --line-buffered -v "^W0000\|^I0000\|absl" >> 日志/逐帧-试点-$ep.log
    else
      CONC=$(cat 夜跑并发.txt 2>/dev/null | tr -cd '0-9'); CONC=${CONC:-120}
      $PY pilot_frames.py $ep --并发 $CONC --名 全量 --预算 800 --单价上限 0.07 2>&1 | grep --line-buffered -v "^W0000\|^I0000\|absl" >> 日志/逐帧-全量-$ep.log
    fi
  done
  after=$(left_now)
  say "一轮结束：待跑 ${before:-?} → ${after:-?} 窗"
  if [ -n "$before" ] && [ -n "$after" ] && [ "$after" -ge "$before" ]; then
    stuck=$((stuck + 1))
    if [ $stuck -ge 3 ]; then say "连续 3 轮没进展（剩 $after 窗反复失败），停，等人看"; break; fi
    sleep 1800
  else
    stuck=0
  fi
done
say "全天跑退出"

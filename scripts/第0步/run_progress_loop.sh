#!/bin/zsh
# 本地流程图第 9、10 步进度条的后台刷新（2026-11-12 加，每 1 小时刷新一次）。
# 循环：跑 update_progress.py 改写 整体进度流程图.html → 睡 1 小时；第 9、10 步都到 100% 写一行日志并退出。
# 只读磁盘、不调任何接口；不碰 run_full_allday.sh / pilot_frames.py / run_prep_full.sh。
# 不用 launchd / cron（后台常驻任务读不了下载文件夹），用 nohup 起：
#   cd 第0步 && nohup ./run_progress_loop.sh >/dev/null 2>&1 &
# 停止：kill $(cat 全量配置/进度刷新.pid)
# 保险：最多跑 14 天自动退出（写日志）。
cd "$(dirname "$0")"
PY=../.venv-vision/bin/python
LOG=日志/进度条刷新.log
INTERVAL=${INTERVAL:-3600}
mkdir -p 日志 全量配置
say() { echo "$(date '+%m-%d %H:%M:%S') $*" >> $LOG; }

if [ -f 全量配置/进度刷新.pid ] && kill -0 "$(cat 全量配置/进度刷新.pid)" 2>/dev/null; then
  echo "已有一份在跑（PID $(cat 全量配置/进度刷新.pid)），退出"; exit 1
fi
echo $$ > 全量配置/进度刷新.pid
say "进度条刷新启动（PID $$，每 $((INTERVAL / 60)) 分钟一次）"
start=$(date +%s)
while true; do
  if $PY update_progress.py >> $LOG 2>&1; then
    say "第 9、10 步都已 100%，刷新退出"; break
  fi
  if [ $(( $(date +%s) - start )) -ge $((14 * 86400)) ]; then
    say "已连续跑满 14 天，刷新退出（要继续就再起一次）"; break
  fi
  sleep $INTERVAL
done
rm -f 全量配置/进度刷新.pid

#!/bin/bash
# 全量预处理总脚本（2026-11-12）：为 15 集产出「指代出题」之前的全部本机材料，零接口费。
# 四条队列并行，命令与参数照抄试点（P17、P05，出处见 日志/字幕轨2-P17上.log、语音-P17.log、姿态-P17上.log 与 开跑记录-20261108.md）：
#   语音队列   一次 1 集（GPU）：ffmpeg 抽 16k 单声道 → whisper-cli large-v3-turbo 逐字（-ml 1 -oj -t 5 -np）→ 字幕/语音/<集>-字词.json
#   字幕轨队列 同时 2 集（4 进程）：subtitle_track.py 上 / 下两片并行 → subtitle_clean.py（试点用系统 python3）→ 字幕/苹果识别/<集>.jsonl
#   姿态队列   同时 3 集（6 进程）：pilot_pose.py 上 / 下两片并行 → 第0步/姿态/<集>-上.jsonl、<集>-下.jsonl
#   出题       某集三样都齐就跑 pilot_deixis.py 出题（一次 1 集）→ 指代层/试点/<集>/题目清单.json + 题图
# 分片取法（照试点，按 全帧-20261107/清单/<集>.tsv 行数 N，帧号 0..N-1）：
#   姿态：上 = 0..N/2-1，下 = N/2..N-1（P17：0–48798 / 48799–97597）
#   字幕：S = 离 N/2 最近的 6 的倍数，上 = 0..S-1，下 = S..999999（P17：0–48797 / 48798–；P05：0–52451 / 52452–）
# 幂等：每步先验产物（姿态按行数 = 帧数，字幕原始按行数 = 采样数，语音 / 清洗 / 出题看文件），齐了就跳过；中途被杀重跑即续。
# 优先级：整棵进程树 nice 15，让位给前台应用和 DeepSeek 跑批（nice 5）。
# 并发：字幕轨 / 姿态同时几集读 第0步/预处理并发.txt（「字幕 2」「姿态 2」两行，改数不用重启：调大 1 分钟内多开一集，调小等手上那集做完再收）。
#   11-12 实测：按原定 字幕 2 + 姿态 3 集开，CPU 0% 空闲、负载 60–100，前台 python 小测慢 2–4 倍（要 ~20 核，本机 10 核）；
#   加苹果 QoS utility 档（QOS=utility）前台不受影响，但本活慢到约 1/4 且 CPU 还空着 27%，划不来，默认不加档。
#   环境变量：NICE=15 QOS=none|utility SUB_MAX=3 POSE_MAX=4（预开的槽数上限）。
# 日志：日志/预处理-全量.log（每步开始 / 结束、出错「预处理出错 <集> <步骤>」、每集「预处理完成 <集>」）；分步日志同试点命名。
# 用法：cd 第0步 && nohup caffeinate -is ./run_prep_full.sh >/dev/null 2>&1 &        （可在末尾跟集号只跑这几集）
# 停止：kill -TERM -$(cat 第0步/预处理状态/run.pid)        （整组停；已完成的产物保留，重跑自动续）
# 不碰 run_full_allday.sh / pilot_frames.py，不调用任何付费接口（pilot_deixis.py 只跑「出题」，不跑「判」）。

# 自成一个进程组（便于整组停止），挂 QoS 档，再降优先级；子进程全部继承
if [ -z "$PREP_PGRP" ]; then
  export PREP_PGRP=1
  if [ "${QOS:-none}" = none ]; then
    exec /usr/bin/perl -e 'setpgrp(0,0); exec @ARGV' /bin/bash "$0" "$@"
  fi
  exec /usr/sbin/taskpolicy -c "$QOS" /usr/bin/perl -e 'setpgrp(0,0); exec @ARGV' /bin/bash "$0" "$@"
fi
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

STEP0="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$STEP0")"
PY="$ROOT/.venv-vision/bin/python"
PY3="$(command -v python3)"
LOG="${PREP_LOG:-$STEP0/日志/预处理-全量.log}"
STATE="${PREP_STATE:-$STEP0/预处理状态}"
SUB_MAX=${SUB_MAX:-3}
POSE_MAX=${POSE_MAX:-4}
NICE=${NICE:-15}
CONC="$STEP0/预处理并发.txt"
[ -f "$CONC" ] || printf '字幕 2\n姿态 2\n' > "$CONC"
FILTER='^W0000|^I0000|absl|INFO|gl_context|landmark_projection'
if [ $# -gt 0 ]; then EPS=("$@"); else EPS=(P01 P03 P11 P13 P15 P19 P21 P23 P25 P27 P29 P37 P48 P07 P09); fi

mkdir -p "$STEP0/日志" "$STATE" "$ROOT/字幕/语音" "$ROOT/字幕/苹果识别/原始" "$STEP0/姿态"
say() { echo "$(date '+%m-%d %H:%M:%S') $*" >> "$LOG"; }
mins() { awk -v a="$1" -v b="$(date +%s)" 'BEGIN{printf "%.1f", (b-a)/60}'; }
lines() { if [ -f "$1" ]; then wc -l < "$1" | tr -d ' '; else echo 0; fi; }
fail() { touch "$STATE/failed-$1-$2"; say "预处理出错 $1 $2${3:+（$3）}"; }

# 单实例
if [ -f "$STATE/run.pid" ] && kill -0 "$(cat "$STATE/run.pid")" 2>/dev/null; then
  echo "已有一份在跑（PID $(cat "$STATE/run.pid")），退出"; exit 1
fi
echo $$ > "$STATE/run.pid"
renice "$NICE" -p $$ >/dev/null 2>&1      # 绝对值（zsh 后台启动自带 +5，不叠加）
rm -rf "$STATE/claims" "$STATE"/failed-* "$STATE/queues.done"
mkdir -p "$STATE/claims"
trap 'say "预处理总脚本收到停止信号（PID $$）"; exit 143' TERM INT

# 按清单算帧数与分片：N 行、末帧 LAST；姿态中点 PMID；字幕切点 S
info() {
  local man="$ROOT/全帧-20261107/清单/$1.tsv" cache="$STATE/帧数-$1.txt"
  if [ -s "$cache" ] && [ "$cache" -nt "$man" ]; then
    read -r N LAST < "$cache"
  else
    [ -f "$man" ] || return 1
    N=$(lines "$man")
    LAST=$(awk -F'\t' 'NR==1||$1+0>m{m=$1+0} END{print m}' "$man")
    echo "$N $LAST" > "$cache"
  fi
  [ "$LAST" -eq $((N - 1)) ] || return 1
  PMID=$((N / 2 - 1))
  S=$(( (N / 2 + 3) / 6 * 6 ))
  SUB_UP=$(( (S - 1) / 6 + 1 ))
  SUB_DN=$(( LAST / 6 - S / 6 + 1 ))
  POSE_UP=$((PMID + 1))
  POSE_DN=$((LAST - PMID))
}

claim() { mkdir "$STATE/claims/$1-$2" 2>/dev/null; }
# 并发闸：第 SLOT 号槽只在 预处理并发.txt 里该队列的数 ≥ SLOT 时才领新集；该队列的集都被领完就退出
slots() { local n; n=$(awk -v k="$1" '$1==k{print $2+0}' "$CONC" 2>/dev/null | tail -1); echo "${n:-$2}"; }
all_claimed() { local e; for e in "${EPS[@]}"; do [ -d "$STATE/claims/$1-$e" ] || return 1; done; return 0; }
gate() {   # 队列 槽号 默认数
  while [ "$2" -gt "$(slots "$1" "$3")" ]; do
    all_claimed "$1" && return 1
    sleep 60
  done
}
failed() { ls "$STATE"/failed-$1-* >/dev/null 2>&1; }

speech_ok() { [ -s "$ROOT/字幕/语音/$1-字词.json" ]; }
sub_raw_ok() { info "$1" && [ "$(lines "$ROOT/字幕/苹果识别/原始/$1-上.jsonl")" -eq "$SUB_UP" ] && [ "$(lines "$ROOT/字幕/苹果识别/原始/$1-下.jsonl")" -eq "$SUB_DN" ]; }
sub_ok() { [ -s "$ROOT/字幕/苹果识别/$1.jsonl" ] && sub_raw_ok "$1"; }
pose_half_ok() { info "$1" && { if [ "$2" = 上 ]; then exp=$POSE_UP; else exp=$POSE_DN; fi; [ "$(lines "$STEP0/姿态/$1-$2.jsonl")" -eq "$exp" ]; }; }
pose_ok() { pose_half_ok "$1" 上 && pose_half_ok "$1" 下; }
deixis_ok() { [ -f "$STEP0/指代层/试点/$1/题目清单.json" ]; }

# ---------- 语音队列（一次 1 集） ----------
speech_worker() {
  local ep t0 part
  for ep in "${EPS[@]}"; do
    claim 语音 "$ep" || continue
    if speech_ok "$ep"; then say "跳过 $ep 语音（已有）"; continue; fi
    say "开始 $ep 语音"; t0=$(date +%s)
    cd "$ROOT" || return
    part="字幕/语音/$ep-字词.part"
    rm -f "$part.json"
    if ffmpeg -v error -y -i "视频/$ep.mp4" -vn -ac 1 -ar 16000 "字幕/语音/$ep.wav" > "$STEP0/日志/语音-$ep.log" 2>&1 \
       && whisper-cli -m 模型/whisper.cpp/ggml-large-v3-turbo.bin -l zh -ml 1 -oj -of "$part" -t 5 -np "字幕/语音/$ep.wav" >> "$STEP0/日志/语音-$ep.log" 2>&1 \
       && "$PY3" -c 'import json,sys; d=json.load(open(sys.argv[1])); assert d["transcription"]' "$part.json" 2>>"$STEP0/日志/语音-$ep.log" \
       && mv "$part.json" "字幕/语音/$ep-字词.json"; then
      say "结束 $ep 语音 用时 $(mins $t0) 分"
    else
      fail "$ep" 语音 "见 日志/语音-$ep.log"
    fi
    rm -f "字幕/语音/$ep.wav" "$part.json"
  done
}

# ---------- 字幕轨队列（每个槽一次 1 集，上 / 下两进程） ----------
sub_half() {   # ep 片 起 止
  cd "$STEP0" || return 1
  "$PY" subtitle_track.py "$1" "$3" "$4" "$2" > "日志/字幕轨2-$1$2.log" 2>&1
}
sub_worker() {
  local ep t0 p1 p2 r1 r2
  for ep in "${EPS[@]}"; do
    gate 字幕 "$SLOT" 2 || return 0
    claim 字幕 "$ep" || continue
    if sub_ok "$ep"; then say "跳过 $ep 字幕轨（已有）"; continue; fi
    if ! info "$ep"; then fail "$ep" 字幕轨 "清单帧号不连续或缺清单"; continue; fi
    if ! sub_raw_ok "$ep"; then
      say "开始 $ep 字幕轨（上 0–$((S - 1))，下 $S–；应得采样 $SUB_UP / $SUB_DN）"; t0=$(date +%s)
      p1=""; p2=""
      [ "$(lines "$ROOT/字幕/苹果识别/原始/$ep-上.jsonl")" -eq "$SUB_UP" ] || { sub_half "$ep" 上 0 $((S - 1)) & p1=$!; }
      [ "$(lines "$ROOT/字幕/苹果识别/原始/$ep-下.jsonl")" -eq "$SUB_DN" ] || { sub_half "$ep" 下 "$S" 999999 & p2=$!; }
      r1=0; r2=0
      [ -n "$p1" ] && { wait "$p1"; r1=$?; }
      [ -n "$p2" ] && { wait "$p2"; r2=$?; }
      if ! sub_raw_ok "$ep"; then
        fail "$ep" 字幕轨 "退出码 上$r1 下$r2，采样 $(lines "$ROOT/字幕/苹果识别/原始/$ep-上.jsonl")/$SUB_UP $(lines "$ROOT/字幕/苹果识别/原始/$ep-下.jsonl")/$SUB_DN"
        continue
      fi
      say "结束 $ep 字幕轨 用时 $(mins $t0) 分"
    fi
    say "开始 $ep 字幕清洗"; t0=$(date +%s)
    if (cd "$STEP0" && "$PY3" subtitle_clean.py "$ep" >> "日志/字幕轨2-$ep下.log" 2>&1) && [ -s "$ROOT/字幕/苹果识别/$ep.jsonl" ]; then
      say "结束 $ep 字幕清洗 句 $(lines "$ROOT/字幕/苹果识别/$ep.jsonl") 用时 $(mins $t0) 分"
    else
      fail "$ep" 字幕清洗 "见 日志/字幕轨2-${ep}下.log 末尾"
    fi
  done
}

# ---------- 姿态队列（每个槽一次 1 集，上 / 下两进程） ----------
pose_half() {  # ep 片 起 止
  cd "$STEP0" || return 1
  set -o pipefail
  "$PY" pilot_pose.py "$1" "$3" "$4" "$2" 2>&1 | grep --line-buffered -Ev "$FILTER" > "日志/姿态-$1$2.log"
}
pose_worker() {
  local ep t0 p1 p2 r1 r2
  for ep in "${EPS[@]}"; do
    gate 姿态 "$SLOT" 2 || return 0
    claim 姿态 "$ep" || continue
    if pose_ok "$ep"; then say "跳过 $ep 姿态（已有）"; continue; fi
    if ! info "$ep"; then fail "$ep" 姿态 "清单帧号不连续或缺清单"; continue; fi
    say "开始 $ep 姿态（上 0–$PMID，下 $((PMID + 1))–$LAST）"; t0=$(date +%s)
    p1=""; p2=""
    pose_half_ok "$ep" 上 || { pose_half "$ep" 上 0 "$PMID" & p1=$!; }
    pose_half_ok "$ep" 下 || { pose_half "$ep" 下 $((PMID + 1)) "$LAST" & p2=$!; }
    r1=0; r2=0
    [ -n "$p1" ] && { wait "$p1"; r1=$?; }
    [ -n "$p2" ] && { wait "$p2"; r2=$?; }
    if pose_ok "$ep"; then
      say "结束 $ep 姿态 用时 $(mins $t0) 分"
    else
      info "$ep"
      fail "$ep" 姿态 "退出码 上$r1 下$r2，行数 $(lines "$STEP0/姿态/$ep-上.jsonl")/$POSE_UP $(lines "$STEP0/姿态/$ep-下.jsonl")/$POSE_DN"
    fi
  done
}

# ---------- 出题（三样齐了就出，一次 1 集） ----------
finish_ep() {
  if [ ! -f "$STATE/完成-$1" ]; then touch "$STATE/完成-$1"; say "预处理完成 $1"; fi
}
deixis_loop() {
  local ep t0 waiting last_round=0
  while true; do
    waiting=0
    for ep in "${EPS[@]}"; do
      if deixis_ok "$ep"; then
        speech_ok "$ep" && sub_ok "$ep" && pose_ok "$ep" && finish_ep "$ep"
        continue
      fi
      failed "$ep" && continue
      if speech_ok "$ep" && sub_ok "$ep" && pose_ok "$ep"; then
        say "开始 $ep 出题"; t0=$(date +%s)
        (cd "$STEP0" && "$PY" pilot_deixis.py 出题 "$ep" 2>&1 | grep -Ev "$FILTER" > "日志/指代出题-$ep.log")
        if deixis_ok "$ep"; then
          say "结束 $ep 出题 $(tail -1 "$STEP0/日志/指代出题-$ep.log") 用时 $(mins $t0) 分"
          finish_ep "$ep"
        else
          fail "$ep" 出题 "见 日志/指代出题-$ep.log"
        fi
      else
        waiting=1
      fi
    done
    [ $waiting -eq 0 ] && break
    if [ -f "$STATE/queues.done" ]; then
      [ $last_round -eq 1 ] && break
      last_round=1
    fi
    sleep 30
  done
}

say "预处理总脚本启动（PID $$，nice $(ps -o nice= -p $$ | tr -d " ")，QoS ${QOS:-默认}；语音 1 集，字幕轨 $(slots 字幕 2) 集、姿态 $(slots 姿态 2) 集并行（读 预处理并发.txt，可调）；共 ${#EPS[@]} 集：${EPS[*]}）"
pids=()
speech_worker & pids+=($!)
for SLOT in $(seq 1 "$SUB_MAX"); do sub_worker & pids+=($!); done
for SLOT in $(seq 1 "$POSE_MAX"); do pose_worker & pids+=($!); done
deixis_loop & dpid=$!
for p in "${pids[@]}"; do wait "$p"; done
touch "$STATE/queues.done"
say "三条队列都已走完，等最后的出题"
wait "$dpid"
ok=0; bad=""
for ep in "${EPS[@]}"; do
  if [ -f "$STATE/完成-$ep" ]; then ok=$((ok + 1)); else bad="$bad $ep"; fi
done
say "预处理总脚本结束：完成 $ok/${#EPS[@]}${bad:+，未完成：$bad（见上方出错行）}"
rm -f "$STATE/run.pid"

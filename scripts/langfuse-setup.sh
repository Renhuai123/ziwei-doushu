#!/usr/bin/env bash
# Dựng Langfuse tự host (Docker) cho tracing AI và nối vào app.
#
#   bash scripts/langfuse-setup.sh          # lần đầu: sinh bí mật, khởi động, ghi key vào .env.local
#   bash scripts/langfuse-setup.sh          # chạy lại: giữ nguyên bí mật cũ, chỉ khởi động
#   docker compose -f infra/langfuse/docker-compose.yml down   # dừng (dữ liệu giữ trong volume)
#
# Cần: Docker (Docker Desktop / OrbStack / Colima) với `docker compose`, openssl, curl.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/infra/langfuse"
ENV_FILE="$DIR/.env"
APP_ENV="$ROOT/.env.local"
PORT="${LANGFUSE_WEB_PORT:-3100}"

command -v docker >/dev/null || { echo "✗ Chưa có Docker. Cài Docker Desktop hoặc OrbStack rồi chạy lại."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "✗ Thiếu plugin 'docker compose'."; exit 1; }
docker info >/dev/null 2>&1 || { echo "✗ Docker chưa chạy (mở Docker Desktop / OrbStack trước)."; exit 1; }

hex() { openssl rand -hex "$1"; }

if [[ ! -f "$ENV_FILE" ]]; then
  echo "→ Sinh bí mật mới vào infra/langfuse/.env"
  ADMIN_PASSWORD="$(hex 12)"
  umask 077
  cat > "$ENV_FILE" <<EOF
# Sinh bởi scripts/langfuse-setup.sh — KHÔNG commit (đã .gitignore).
LANGFUSE_WEB_PORT=$PORT
NEXTAUTH_URL=http://localhost:$PORT
NEXTAUTH_SECRET=$(hex 32)
SALT=$(hex 32)
ENCRYPTION_KEY=$(hex 32)
POSTGRES_PASSWORD=$(hex 16)
DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/postgres
CLICKHOUSE_PASSWORD=$(hex 16)
REDIS_AUTH=$(hex 16)
MINIO_ROOT_PASSWORD=$(hex 16)
LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY=\${MINIO_ROOT_PASSWORD}
LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY=\${MINIO_ROOT_PASSWORD}
LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY=\${MINIO_ROOT_PASSWORD}
TELEMETRY_ENABLED=false

# Tổ chức / dự án / tài khoản tạo sẵn lúc khởi động lần đầu
LANGFUSE_INIT_ORG_ID=ziwei
LANGFUSE_INIT_ORG_NAME=ziwei-doushu
LANGFUSE_INIT_PROJECT_ID=ziwei-interpret
LANGFUSE_INIT_PROJECT_NAME=interpret
LANGFUSE_INIT_PROJECT_PUBLIC_KEY=pk-lf-$(hex 16)
LANGFUSE_INIT_PROJECT_SECRET_KEY=sk-lf-$(hex 16)
LANGFUSE_INIT_USER_EMAIL=admin@ziwei.local
LANGFUSE_INIT_USER_NAME=admin
LANGFUSE_INIT_USER_PASSWORD=$ADMIN_PASSWORD
EOF
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

echo "→ Khởi động Langfuse (lần đầu phải tải image, có thể mất vài phút)"
docker compose -f "$DIR/docker-compose.yml" --env-file "$ENV_FILE" -p ziwei-langfuse up -d

echo -n "→ Chờ Langfuse sẵn sàng tại http://localhost:$PORT "
for _ in $(seq 1 90); do
  if curl -sf "http://localhost:$PORT/api/public/health" >/dev/null; then echo " ✓"; break; fi
  echo -n "."; sleep 2
done
curl -sf "http://localhost:$PORT/api/public/health" >/dev/null || {
  echo; echo "✗ Langfuse chưa lên. Xem log: docker compose -p ziwei-langfuse logs langfuse-web"; exit 1; }

# Ghi key vào .env.local của app (chỉ thêm nếu chưa có)
touch "$APP_ENV"
if grep -q '^LANGFUSE_PUBLIC_KEY=' "$APP_ENV"; then
  echo "→ .env.local đã có LANGFUSE_* — giữ nguyên"
else
  cat >> "$APP_ENV" <<EOF

# Langfuse tự host (scripts/langfuse-setup.sh)
LANGFUSE_BASE_URL=http://localhost:$PORT
LANGFUSE_PUBLIC_KEY=$LANGFUSE_INIT_PROJECT_PUBLIC_KEY
LANGFUSE_SECRET_KEY=$LANGFUSE_INIT_PROJECT_SECRET_KEY
EOF
  echo "→ Đã thêm LANGFUSE_* vào .env.local (khởi động lại 'npm run dev' để nạp)"
fi

cat <<EOF

✓ Langfuse: http://localhost:$PORT
  Đăng nhập: $LANGFUSE_INIT_USER_EMAIL / $LANGFUSE_INIT_USER_PASSWORD   (lưu trong infra/langfuse/.env)
  Dự án: $LANGFUSE_INIT_PROJECT_NAME — mỗi câu hỏi chatbot là một trace "interpret".
EOF

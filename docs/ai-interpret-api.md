# AI 解读接口（/api/interpret）

开源版仓库本来只提供排盘引擎，`/api/interpret` 需要自己实现。本目录已内置一份可直接使用的实现：

| 文件 | 作用 |
|------|------|
| `app/api/interpret/route.ts` | 路由入口：校验请求、组装系统提示词、代理上游流式响应 |
| `lib/ai/interpret-prompt.ts` | 系统提示词 + 命盘摘要（十二宫 / 大限 / 四化 / 已识别格局） |
| `lib/ai/provider.ts` | OpenAI 兼容 Provider 适配与 SSE 转换，API Key 只在服务端读取 |

## 1. 最快跑通：DeepSeek

1. 到 <https://platform.deepseek.com/api_keys> 创建 API Key。
2. 编辑项目根目录的 `.env.local`（没有就从 `.env.example` 复制）：

   ```bash
   AI_PROVIDER=deepseek
   DEEPSEEK_API_KEY=sk-你的真实key
   # 可选
   # DEEPSEEK_MODEL=deepseek-chat
   # DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
   ```

3. 重启开发服务器（Next.js 只在启动时读取 `.env.local`）：

   ```bash
   # Ctrl+C 停掉后重新执行
   npm run dev
   ```

4. 打开 <http://localhost:3000/chart>，起盘后右侧会自动请求「命格总览」。第一次请求会消耗一次模型调用。

> 排盘本身仍然不需要任何 API Key；只有右侧 AI 解读会用到。

## 2. 换成其他 OpenAI 兼容服务

DeepSeek、MIMO、OpenAI、Moonshot、Qwen、OpenRouter、Ollama 等都使用
`POST {base}/chat/completions` 的流式协议。

### MIMO（沿用 `.env.example` 的变量名）

```bash
AI_PROVIDER=mimo
MIMO_API_KEY=...
MIMO_BASE_URL=https://你的服务/v1
MIMO_MODEL=模型名
```

### 任意 OpenAI 兼容服务

```bash
AI_PROVIDER=openai-compatible
AI_API_KEY=...
AI_BASE_URL=https://你的服务/v1
AI_MODEL=模型名
```

`AI_BASE_URL` 末尾带不带 `/v1` 都可以，代码会自动拼 `/chat/completions`；
如果填的是完整的 `.../chat/completions` 也不会重复拼接。

### 本地 Ollama（不花钱，但中文命理质量取决于模型）

```bash
AI_PROVIDER=openai-compatible
AI_BASE_URL=http://127.0.0.1:11434/v1
AI_MODEL=qwen2.5:7b
# 本地地址允许 AI_API_KEY 留空
```

先确保 `ollama serve` 已启动、模型已 `ollama pull`。

### 可选调参

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `AI_TEMPERATURE` | `0.7` | 解读发散程度 |
| `AI_MAX_TOKENS` | `2400` | 单次输出上限；提示词要求 700–1000 字，通常足够 |

## 3. 接口契约

前端 `components/InsightPanel.tsx` / `ChatPanel.tsx` 依赖下面的约定；改接口时不要破坏它。

### 请求

```http
POST /api/interpret
Content-Type: application/json

{
  "chart": { /* ZiweiChart，前端由 generateChart() 生成 */ },
  "messages": [
    { "role": "user", "content": "请生成命格总览……" }
  ]
}
```

- `messages` 只接受 `user` / `assistant`，最后一条必须是 `user`。
- 服务端只保留最近 16 条消息，单条最多 4000 字，历史总计最多 24000 字。

### 成功响应

`200 text/event-stream`：

```text
data: {"delta":{"text":"【命格定性】"}}

data: {"delta":{"text":"……"}}

data: [DONE]

```

前端把每个 `delta.text` 追加到当前 assistant 消息里。

### 错误响应

| 状态码 | 含义 | 响应体 |
|--------|------|--------|
| `400` | JSON 不合法 / 命盘结构不完整 / 缺提问 | `{"error":"..."}` |
| `503` | 没配置 API Key | `{"error":"AI 解读未配置：..."}` |
| `502` | 上游返回错误或不可达 | `{"error":"..."}` |
| `504` | 上游超时（120 秒） | `{"error":"..."}` |

前端会读取 `error` 字段并显示在解读面板里；旧行为里「404 = 开源版缺接口」的提示
仍然保留，仅用于没有这个路由时的兜底。

## 4. 手动验证

开发服务器启动后，用一条最小的命盘请求检查流：

```bash
curl -N http://localhost:3000/api/interpret \
  -H "Content-Type: application/json" \
  --data-binary @payload.json
```

`payload.json` 至少需要：

```json
{
  "chart": {
    "birthInfo": { "year": 1990, "month": 5, "day": 10, "hour": 0, "gender": "male" },
    "lunarInfo": { "lunarYear": 1990, "lunarMonth": 4, "lunarDay": 16, "yearStem": 6, "yearBranch": 6, "isLeapMonth": false },
    "mingGongBranch": 0,
    "shenGongBranch": 0,
    "wuxingJu": 2,
    "wuxingJuName": "水二局",
    "ziweiPos": 0,
    "palaces": [
      { "branch": 0, "stem": 0, "name": "命宫", "stars": [{ "name": "紫微", "type": "major" }] },
      { "branch": 1, "stem": 1, "name": "兄弟宫", "stars": [] },
      { "branch": 2, "stem": 2, "name": "夫妻宫", "stars": [] },
      { "branch": 3, "stem": 3, "name": "子女宫", "stars": [] },
      { "branch": 4, "stem": 4, "name": "财帛宫", "stars": [] },
      { "branch": 5, "stem": 5, "name": "疾厄宫", "stars": [] },
      { "branch": 6, "stem": 6, "name": "迁移宫", "stars": [] },
      { "branch": 7, "stem": 7, "name": "交友宫", "stars": [] },
      { "branch": 8, "stem": 8, "name": "官禄宫", "stars": [] },
      { "branch": 9, "stem": 9, "name": "田宅宫", "stars": [] },
      { "branch": 10, "stem": 0, "name": "福德宫", "stars": [] },
      { "branch": 11, "stem": 1, "name": "父母宫", "stars": [] }
    ],
    "daXians": [],
    "currentAge": 35,
    "currentDaXianIndex": 0
  },
  "messages": [{ "role": "user", "content": "请用一句话概括命格。" }]
}
```

这只是接口冒烟测试；真实命盘请走页面起盘，数据更完整，解读质量也更好。

## 5. 上公网前的注意事项

这份实现定位是「本地/自用」。它只做了请求结构校验和历史长度限制，**没有**做：

- 登录 / 会员权限
- 按 IP 或用户的频率限制
- 预算上限、并发限制、滥用防护
- 审计日志

如果部署到公网，务必在反向代理或路由里补上这些，否则它会变成一个任何人都能调用的
LLM 代理，账单由你承担。

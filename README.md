<div align="center">

# 紫微斗数 · 开源排盘引擎

[![CI](https://github.com/Renhuai123/ziwei-doushu/actions/workflows/ci.yml/badge.svg)](https://github.com/Renhuai123/ziwei-doushu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](./LICENSE)
[![Dataset: CC BY 4.0](https://img.shields.io/badge/dataset-CC%20BY%204.0-green.svg)](./DATASET-LICENSE)

**中文** · [English](./README.en.md)

</div>

基于<strong>倪海厦《天纪》</strong>教学体系的紫微斗数排盘系统，包含完整排盘算法、四化系统、格局知识库、古籍原文数据，以及 **51.8 万条命盘样本数据**。

在线体验：[metisziwei.com](https://metisziwei.com/?from=gh-readme)，排盘、AI 解读、命盘历史全部开放。

> **注：关于六亲判断**
>
> 紫微斗数在六亲（父母、兄弟、子女等）判断上存在一定局限。倪师在《天纪》中指出：“斗数批六亲本来就比较差一点。”（[2上 · 00:25:27](https://www.bilibili.com/video/BV1KJsLekEfA?p=3&t=1527)）在传统术数中，铁板神数在核对六亲方面有其独特优势（[2上 · 00:03:15](https://www.bilibili.com/video/BV1KJsLekEfA?p=3&t=195)）；倪师仍以紫微斗数为核心，是因为它能结合地理、环境与人事进行综合判断，形成“上知天文、下知地理、中知人事”的完整体系（[2上 · 00:25:43](https://www.bilibili.com/video/BV1KJsLekEfA?p=3&t=1543)）。因此，与六亲相关的分析仅供参考；[metisziwei.com](https://metisziwei.com/?from=gh-readme) 上父母、兄弟、子女三个维度也附有同样的说明。

---

## 目录

| | 章节 | 一句话 |
|---|------|--------|
| 一 | [本轮更新](#一本轮更新2026-09-21) | 时隔三个月，引擎同步 + 补上回归与 CI |
| 二 | [51.8 万命盘样本数据集](#二518-万命盘样本数据集) | 规格、下载、用途、许可 |
| 三 | [快速开始](#三快速开始) | 克隆到跑起来 |
| 四 | [排盘引擎](#四排盘引擎) | 能做到什么、文件怎么分、古籍数据 |
| 五 | [倪师《天纪·紫微斗数》原话](#五倪师天纪紫微斗数原话) | 14 讲 + 2 段补充、1848 条，一图看全，每条可回放 |
| 六 | [界面是一份 Demo](#六界面是一份-demo) | 不是线上那套，差距写明 |
| 七 | [开源边界](#七开源边界什么不在里面) | 什么开源、什么不开源 |
| 八 | [维护节奏与贡献](#八维护节奏与贡献) | 同步节奏、issue / PR 口径 |
| 九 | [协议](#九协议) | 代码 MIT / 数据 CC BY 4.0 / 古籍公版 / 倪师原话非商用 |
| 十 | [关于与联系](#十关于与联系) | 项目理念、技术栈、联系方式 |

---

## 一、本轮更新（2026-09-21）

> **2026-10-03 补充**：倪师《天纪·紫微斗数》原话 1848 条单独成章（第五章）；合并外部贡献 #29（时辰序号校验）；引擎拒绝不存在的公历日期，数据集补字段口径与已知问题；提交 package-lock.json；站点地址改为可配置；合盘演示改用本地引擎起盘、AI 接口缺失时明确提示；补齐贡献指南、行为准则、问题与 PR 模板；新增英文简介 [README.en.md](./README.en.md)；去掉两个用不上的部署工具包（vercel CLI、@cloudflare/next-on-pages），依赖从 483 个减到 185 个；随后升级到 Next.js 16 修掉 postcss 漏洞，GitHub 安全提醒从 51 条清零。

![本轮更新总览](./docs/update-20260921.png)

时隔三个月，本仓库完成一次完整更新（[PR #28](https://github.com/Renhuai123/ziwei-doushu/pull/28)，26 个文件、+2736 / −108 行）：

**1. 排盘引擎同步到线上口径** —— `algorithm.ts` 从 181 行到 641 行，另更新 sihua / types / constants / patterns / cities / famous；新增 8 个模块（1367 行）：

| 模块 | 作用 |
|------|------|
| `true-solar-time.ts` | 真太阳时校正（经度差 + 均时差） |
| `dst-cn.ts` | 中国 1986–1991 夏令时 |
| `lunar-solar.ts` | 农历 / 公历互转与闰月边界 clamp |
| `wenmo-data.ts` / `wenmo-tables.generated.ts` / `wenmo-config.ts` | 星曜亮度流派数据与对照表、闰月与晚子时口径配置 |
| `shier-shen.ts` | 十二神煞 |
| `yunxian-context.ts` | 运限上下文（含童限） |

**2. 补上回归测试与 CI** —— 此前本仓库没有任何测试。现在 5 条排盘回归，`npm test` 一条命令跑完，每次 push 与 PR 在 GitHub Actions 上自动跑。

**3. 修掉样本时辰注释错位**（[#26](https://github.com/Renhuai123/ziwei-doushu/issues/26)）—— `famous.ts` 里 11 条名人样本有 7 条的时辰注释与 `hour` 索引不符（`hour` 一直是**时辰地支索引 0–11**，不是 0–23 的小时数）。已改正并加回归钉住。

**4. 积压 issue 从 18 条清到 4 条**，留下的都是还在走的。

**5. 文档与许可** —— 新增 [`DATASET-LICENSE`](./DATASET-LICENSE)；README 补齐引擎能力清单、维护节奏、开源边界；修正两处不实描述（数据集「口径与线上完全一致」、界面「完整的 Next.js 15 前端」）。

---

## 二、51.8 万命盘样本数据集

> **下载位置：本仓库右侧 [Releases](https://github.com/Renhuai123/ziwei-doushu/releases/tag/v3.0-samples) 页面**

我们开源了一套完整的紫微斗数命盘样本数据集，覆盖 **51.8 万种排盘组合**（年 60 × 月 12 × 日 30 × 时 12 × 性别 2），每条样本包含完整的命盘结构和基于倪海厦体系的解读文本。

### 2.1 数据规格

| 项目 | 说明 |
|------|------|
| 样本数量 | **518,400 条** |
| 总大小 | 5.5 GB（分 3 卷压缩） |
| 体系 | 倪海厦《天纪》正统（纯飞星派已下线） |
| 内容 | 命盘 JSON + 13 主题解读文本（命格总览、财运、事业、感情、健康等） |
| 验证 | 男女命差异化 100%、健康含子午流注 100%、女命含妇科保养 100% |
| 口径 | 由 **v3 版排盘引擎 + 当期断语库**生成；线上引擎在持续更新，新版输出与本数据集可能有差异 |

**字段口径**（每条样本由 `birthInfo` 生成，常被看错的是 `hour`）：

| 字段 | 含义 |
|------|------|
| `birthInfo.year` / `month` / `day` | **公历**出生日期：1924–1983 年（一个完整甲子），每月取 1–30 日 |
| `birthInfo.hour` | **时辰序号 0–11**，不是 0–23 点钟：子 = 0、丑 = 1 …… 亥 = 11 |
| `birthInfo.gender` | `male` / `female` |
| `birthInfo.longitude` | 固定 120（东经 120°，未做各地真太阳时校正） |
| 文件名 `YYYY-MM-DD-hHH-性别.json` | 其中 `hHH` 同样是时辰序号，例如 `h11` 是亥时，不是上午 11 点 |

时辰序号与钟点对照：

| 序号 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 时辰 | 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 |
| 钟点 | 23–1 | 1–3 | 3–5 | 5–7 | 7–9 | 9–11 | 11–13 | 13–15 | 15–17 | 17–19 | 19–21 | 21–23 |

23:00–23:59 出生（晚子时）按次日排盘、时辰取 0；00:00–00:59 出生（早子时）按当日排盘、时辰同样取 0。

**已知问题：约 2,520 条样本的日期并不存在。** 生成时每个月都取了 1–30 日，所以 2 月 30 日，以及非闰年的 2 月 29 日也生成了样本，共 105 个日期 × 12 时辰 × 2 性别 = 2,520 条，占 0.49%。v3 引擎遇到这类日期不报错，而是顺延成 3 月 1–2 日排盘，所以这些样本的内容与对应的 3 月 1–2 日样本重复。使用时请过滤掉：`month = 2` 且 `day = 30`，或 `month = 2` 且 `day = 29` 且该年不是闰年。引擎从 2026-10-03 起会直接拒绝不存在的日期，下一版数据集不会再有这类样本。

### 2.2 下载方式

前往 [Releases](https://github.com/Renhuai123/ziwei-doushu/releases/tag/v3.0-samples) 下载以下文件：

```
ziwei-samples-v3-part1.zip.001  (1.9 GB)
ziwei-samples-v3-part2.zip.002  (1.9 GB)
ziwei-samples-v3-part3.zip.003  (1.8 GB)
SHA256SUMS.txt                  (校验文件)
```

下载后合并解压：

```bash
# macOS / Linux
cat ziwei-samples-v3-part*.zip.* > combined.zip
unzip combined.zip

# Windows (PowerShell)
Get-Content ziwei-samples-v3-part*.zip.* -Encoding Byte -ReadCount 0 | Set-Content combined.zip -Encoding Byte
Expand-Archive combined.zip
```

### 2.3 用途

- 微调小模型的训练语料（51.8 万 input-output 配对）
- AI 对话的 RAG 检索源
- 修改 `patterns.ts` 后做 A/B 基线对比
- 紫微斗数研究与数据分析

### 2.4 数据许可与引用

📂 **完全开源 · 可自由商用** —— 你可以在任何项目里使用这套数据，包括但不限于：

- 商业产品 / SaaS / 付费应用
- AI 模型微调（开源或闭源模型均可）
- 二次开发、再分发、衍生数据集
- 学术研究、技术博客、教学课程

无需付费、无需申请、无需事先告知。

**唯一的要求是保留数据来源标注（attribution）**：

> 本项目使用了 **紫微斗数开源样本数据集 v3.0**（518,400 条）
> 来源：https://github.com/Renhuai123/ziwei-doushu
> 作者：王多鱼AI

放在哪里都行：

- **网页 / 产品**：About 页 / 关于我们 / 数据来源 / 页脚，写一行链接即可
- **AI 模型**：模型卡（Model Card）或数据集卡（Dataset Card）的 "Training Data" 字段
- **学术论文**：参考文献或致谢章节
- **二次发布的数据集**：README 或 metadata 文件里注明上游来源

仅此一条，其余都自由。完整条款见 [DATASET-LICENSE](./DATASET-LICENSE)。希望这套数据能帮你做出好东西 —— 做出来记得来小红书 / 抖音 / 闲鱼 **@王多鱼AI** 打个招呼 👋

---

## 三、快速开始

```bash
# 克隆
git clone https://github.com/Renhuai123/ziwei-doushu.git
cd ziwei-doushu

# 安装依赖
npm install

# 配置环境变量（只看排盘可以跳过；AI 配置仅在你自己实现了 /api/* 接口时才用得上）
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

本地验证：

```bash
npm run typecheck   # TypeScript 全量类型检查
npm test            # 排盘引擎回归（768 盘 × 紫微铁律、夏令时、立春边界、红鸾天喜、样本时辰一致性、时辰序号边界、日期合法性、同宫双四化）
```

每次 push 与 PR 都会在 GitHub Actions 上跑同一套（见 [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)）。

> **注意：开源版不含后端 API 路由。**排盘、命盘展示、合盘起盘都在浏览器里用本仓库的引擎完成，**不需要任何 API Key**。AI 解读（`/api/interpret`）和合盘 AI 分析（`/api/heming`）需要你自己实现接口；没实现之前，这两处会直接提示「开源版不含该接口」，配置 API Key 也不会变成可用（#30 就是这个原因）。

---

## 四、排盘引擎

排盘内核全部在 `lib/ziwei/`。

### 4.1 能做到什么（与常见排盘库的差异）

| 能力 | 说明 |
|------|------|
| **真太阳时校正** | 按出生地经度算时差 + 均时差，避免东西向差一个时辰 |
| **中国夏令时** | 1986–1991 年的夏令时区间自动扣除 |
| **闰月四种口径** | 闰月归前月 / 归后月 / 按日切分 / 按本月，可配置，不写死一派 |
| **晚子时换日** | 23:00–23:59 按次日排盘、00:00–00:59 按本日；换日策略可切换 |
| **星曜亮度 7 档** | 庙 / 旺 / 得 / 利 / 平 / 不 / 陷，另保留 3 档粗分类做显示降级 |
| **亮度流派可切换** | 不同流派（含文墨不同版本）对辅星亮度判法不一致，做成开关而非写死 |
| **四化与飞星** | 生年四化、大限 / 流年四化、飞星自化 |
| **十二神煞** | 本命层按生年支起，流年层改按流年支起 |
| **格局判定** | 1100+ 行规则库（紫府同宫、日月并明、七杀朝斗等） |

### 4.2 文件怎么分

| 文件 | 说明 |
|------|------|
| `algorithm.ts` | 完整排盘流程：安命宫、定五行局、安十四主星、安辅星、排大限流年 |
| `constants.ts` | 天干地支、十四主星、辅星常量 |
| `sihua.ts` | 四化飞星系统（禄权科忌），含各天干四化对照表 |
| `patterns.ts` | **1100+ 行格局知识库**：紫府同宫、日月并明、七杀朝斗等经典格局判定规则 |
| `heming-knowledge.ts` | 合盘方法论：倪师体系下双盘比对逻辑 |
| `types.ts` | TypeScript 类型定义 |
| `cities.ts` | 中国城市经纬度，用于真太阳时校正 |
| `famous.ts` | 历史名人命盘示例数据 |
| `wenmo-data.ts` / `wenmo-tables.generated.ts` / `wenmo-config.ts` | 星曜亮度流派数据与对照表、闰月与晚子时口径配置 |
| `shier-shen.ts` | 十二神煞（本命按生年支起、流年层按流年支起） |
| `true-solar-time.ts` | 真太阳时校正（经度差 + 均时差） |
| `dst-cn.ts` | 中国 1986–1991 夏令时年份与区间 |
| `yunxian-context.ts` | 运限上下文（含童限处理） |
| `lunar-solar.ts` | 农历 / 公历互转与闰月边界 clamp |

### 4.3 古籍原文（`lib/classics/`）

- **骨髓赋**（`gusuifu.ts`）— 紫微斗数核心歌诀
- **紫微斗数全集**（`quanji.ts`）— 清代古本
- **紫微斗数全书**（`quanshu.ts`）— 陈希夷传本

### 4.4 SEO 知识图谱（`lib/seo/`）

14 主星 × 12 宫位的结构化知识数据，可用于内容生成或知识库构建。

---

## 五、倪师《天纪·紫微斗数》原话

![倪海厦《天纪·紫微斗数》一图看全](./docs/tianji-ziwei/overview.png)

倪海厦《天纪》紫微斗数部分的原话共 **1848 条**：正课 14 讲（第 2–15 讲上半）加 2 段补充，按讲分成 16 个文件，放在 [`docs/tianji-ziwei/`](./docs/tianji-ziwei/)。每条都带出处时间，点一下就跳回 B 站原视频的那一秒。

- **怎么读**：先在上图里找到想看的主题，再点进对应那一讲，比如 [5上](./docs/tianji-ziwei/5%E4%B8%8A.md)（紫微在子）、[13上](./docs/tianji-ziwei/13%E4%B8%8A.md)（杀破狼、科权禄三会）。
- **从哪来**：取自姊妹仓库 [nihai-tianji-corpus](https://github.com/Renhuai123/nihai-tianji-corpus)，以语料库为准，会随语料库同步。
- **能不能商用**：**不能**。这一章的内容单独采用 CC BY-NC-SA 4.0，详见[九、协议](#九协议)。

---

## 六、界面是一份 Demo

界面代码在 `app/` 与 `components/`。仓库里的界面是**一套最小可运行示例**，作用是把排盘引擎跑起来、把盘画出来，方便你在它基础上做自己的产品。**线上商业版的界面不在开源范围内**，两者差距很大：

| 页面 / 组件 | 本仓库（Demo） | 线上商业版 |
|------|------|------|
| 排盘页 `app/chart/page.tsx` | 75 行 | 1227 行 |
| 解读面板 `InsightPanel` | 467 行 | 5088 行 |
| 命盘方格 `ChartBoard` | 285 行 | 1334 行 |
| 宫位格 `PalaceCell` | 201 行 | 1192 行 |
| 合盘页 `app/heming/page.tsx` | 368 行 | 1937 行 |

**Demo 能跑通的**：出生信息表单、命盘方格与宫位详情、本命 / 大限 / 流年切换、古籍阅读器（全文搜索）、命理百科（14 主星 × 12 宫位）、亮暗主题、移动端适配。

**Demo 里没有的**：线上重做过的交互界面、AI 流式解读、合盘图谱、分享卡片，以及**断语内容本身**（`db-analysis.ts` 是占位实现）。也就是说，Demo 画得出盘，但给不出线上那套解读。

---

## 七、开源边界：什么不在里面

| | 内容 |
|---|---|
| ✅ **开源** | 排盘引擎（`lib/ziwei/`）、古籍公版原文（`lib/classics/`）、SEO 知识图谱（`lib/seo/`）、Demo 界面、51.8 万样本数据集 |
| ❌ **不开源** | 断语库（`lib/ziwei/db-analysis.ts` 是占位，线上是上万行的 13 主题断语）、AI 解读 prompt、后端 API（`/api/interpret` 等）、用户系统（登录 / 会员 / 支付）、服务端安全（签名、防刷、水印）、部署配置 |

如果你需要 AI 解读能力，可以参考 `lib/ziwei/patterns.ts` 和 `heming-knowledge.ts` 里的知识库，结合任意 LLM 自行构建 prompt。

---

## 八、维护节奏与贡献

这个仓库是**排盘引擎 + 数据集的开放快照**，不是一个全职维护的开源产品，说清楚免得大家猜：

- **引擎同步**：随线上发版同步 `lib/ziwei/` 的引擎层并打 tag；断语库、AI 解读、商业站前端不在同步范围内。
- **Issue**：会看，但回复可能不及时；带复现步骤或具体盘例（年月日时 + 性别 + 哪一条不对）的问题优先处理。
- **PR**：欢迎，尤其是回归测试、口径修正、文档。动到排盘口径的改动请附上依据（古籍原文或可核对的对照）。

---

## 九、协议

本仓库分四部分授权。前三部分是宽松协议，**商用没有限制**；倪师原话目录**不许商用**：

| 内容 | 协议 | 简单说 |
|------|------|--------|
| **代码**（`lib/`、`app/`、`components/`） | [MIT License](./LICENSE) | 拿去随便用，保留 LICENSE 文件即可 |
| **数据**（Releases 中的 51.8 万样本数据集 v3.0） | [CC BY 4.0](./DATASET-LICENSE) · 要求 attribution | 商用也行，**注明数据来源即可** |
| **古籍原文**（骨髓赋、紫微斗数全集 / 全书等） | Public Domain | 古书都是公有领域，不存在版权 |
| **倪师原话**（[`docs/tianji-ziwei/`](./docs/tianji-ziwei/)） | [CC BY-NC-SA 4.0](./docs/tianji-ziwei/LICENSE.md) | 可以引用、转载，注明出处；**不许商用**，改编后用同样协议 |

**一句话**：代码和数据拿去用，商用也行，把来源链接带上就行；倪师原话只限非商业的学习研究。

---

## 十、关于与联系

### 项目理念

紫微斗数是中国传统命理学的瑰宝，倪海厦老师在《天纪》中系统梳理了正宗的紫微斗数体系。我们希望通过技术手段让更多人接触和学习这门学问。

开源排盘算法和知识库，是因为我们相信：**算法是公开的传统智慧，不应该被锁在围墙里**。真正的价值在于解读的深度、用户体验的打磨、以及持续运营的积累。

想自己搭？代码都在这里，拿去用。嫌麻烦？来 [metisziwei.com](https://metisziwei.com/?from=gh-readme) 直接用。

### 技术栈

- **框架**：Next.js 16（App Router）
- **语言**：TypeScript
- **样式**：Tailwind CSS + CSS Variables 设计系统
- **排盘**：基于 [iztro](https://github.com/SylarLong/iztro) + lunar-javascript
- **动画**：Framer Motion

### 联系

- 线上平台：[metisziwei.com](https://metisziwei.com/?from=gh-readme)（已完成 ICP 备案：渝ICP备2026013379号-1）
- 提问题、提修复：见 [CONTRIBUTING.md](./CONTRIBUTING.md)；使用交流请到 [讨论区](https://github.com/Renhuai123/ziwei-doushu/discussions)
- 💕 发财的小手点一下：小红书 / 抖音 / 闲鱼 / X 关注 **王多鱼AI**，第一时间看上线 + 解锁更多紫微干货～

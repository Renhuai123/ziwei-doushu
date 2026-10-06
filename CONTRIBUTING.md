# 参与贡献

欢迎提问题、提修复、提建议。先说清两件事，能省掉很多来回：

- 本仓库是 [metisziwei.com](https://metisziwei.com/?from=gh-contrib) 排盘引擎的**开源快照**，定期从线上同步（节奏见 README「维护节奏与贡献」）。
- 开源版**不含**断语库、AI 解读提示词和任何 `/api/*` 后端接口（见 README「开源边界」）。AI 解读、合盘分析在开源版里返回 404 是预期行为，需要你自己实现。

## 提问题

- **怎么用、想交流**：去 [讨论区](https://github.com/Renhuai123/ziwei-doushu/discussions)。
- **觉得盘排得不对**：用「排盘结果疑问」模板，附上公历出生日期、几点几分、出生地或经度、性别、本项目的结果，以及你拿来对照的结果。只写「不准」我们没法查。
  - 辅星亮度、闰月归属、晚子时是否换日，各流派本来就不同，引擎里做成了可切换的口径；这类差异不算 bug，但欢迎指出。
- **程序报错、页面异常**：用「程序问题」模板，写清复现步骤和报错。
- **正式站（metisziwei.com）的问题**：用「正式站问题」模板。

请不要在 issue 里贴手机号、验证码，或未经本人同意的他人生辰信息。

## 提交代码

```bash
npm ci               # 按 package-lock.json 安装
npm run typecheck    # 类型检查
npm test             # 排盘回归
```

- 一个 PR 只做一件事，说明里写清改了什么、为什么。
- **改排盘结果的**：附上对照证据（出处，或其他排盘软件的截图），并在 `scripts/regression/` 加回归测试、登记到 `package.json` 的 `test` 脚本。没有出处的口径改动一般不收。
- CI 会在每次 push 和 PR 上跑同一套检查。

## 许可

提交即表示你同意贡献内容按对应协议发布：

- 代码：[MIT](./LICENSE)
- 样本数据集：[CC BY 4.0](./DATASET-LICENSE)
- 倪师原话目录 `docs/tianji-ziwei/`：[CC BY-NC-SA 4.0](./docs/tianji-ziwei/LICENSE.md)，不许商用

---

**English.** Issues and PRs are welcome. This repo is an open snapshot of the charting engine behind metisziwei.com; the interpretation database, AI prompts and all `/api/*` backend routes are not included, so AI features return 404 by design. For a chart you believe is wrong, please use the "Chart result question" form with full birth data and a reference result. Before opening a PR, run `npm ci`, `npm run typecheck` and `npm test`; changes to chart results need evidence and a regression test.

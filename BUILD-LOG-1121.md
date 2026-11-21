# VerdictKit BUILD-LOG — 2026-11-21（hooks 接入轮）

背景：4,000 Kiroween credits 已于 2026-11-21 兑换到账（主线在网页用量页
核实：kiroween26 条目 0/4000 已用、剩 42 天），建造提前启动。本轮三件事：
CLI 状态核查、hooks 真格式样本、hooks 接入 + 验证 + 本地提交。

---

## 1. Kiro CLI 状态核查（隔离 HOME `~/workspace/kiroween-test`，CLI 3.5.0）

- **登录仍有效**：`kiro-cli whoami` 原文摘要 —
  `Logged in with Builder ID` / `Email: 022888@gmail.com`。
  （`kiro-cli profile` 返回 "only available for Pro users"，免费层无此命令，
  与额度无关。）
- **模型可列**：`kiro-cli chat --list-models --format json` 成功返回 8 个模型，
  与 NOTES.md 记录一致：auto（默认，1.0×）/ claude-sonnet-4.5（1.3×）/
  claude-haiku-4.5（0.4×）/ deepseek-3.2（0.25×）/ minimax-m2.5（0.25×）/
  minimax-m2.1（0.15×）/ glm-5（0.5×）/ qwen3-coder-next（0.05×）。
- **额度（CLI 侧）**：CLI 无 usage/credits 子命令；用 `chat --no-interactive
  "/usage"`（v3、v2 两引擎各测一次，结果相同）原文摘要 —
  `Estimated Usage | resets on 2026-12-01 | KIRO FREE` /
  `Credits (0.00 of 50 covered in plan), 0.0%`。
  **结论：账号额度正常（本月计划额度 50、已用 0）；但 CLI 的 /usage 只显示
  计划内额度，不显示 4,000 bonus credits** —— bonus 以网页用量页为准
  （主线已核实到账）。CLI 侧看不到 bonus 是 CLI 3.5.0 的显示局限，不是未到账。

### 🔴 重要异常：模型推理被临时停用（TEMPORARILY_SUSPENDED）

样本实跑时（见 §2）模型调用返回 HTTP 403，原文摘要：
`Your User ID is temporarily suspended. We detected unusual user activity
and locked it as a security precaution. To restore access, please contact
our support team…`（`AccessDeniedException` / `TEMPORARILY_SUSPENDED`，
requestId c8914045-b7a1-4a30-92f9-9a7275b549f5）。随后一次默认模型重试在
更早阶段失败（`ModelRegistryUnavailableError`）。whoami / list-models /
/usage 等只读命令不受影响，仍正常。**影响：账号解封前，Kiro 无法真正跑
模型建造（chat 推理、agent 写文件都过不去）。** 本轮未再反复重试以免加重
风控；恢复路径是按报错指引联系 Kiro 支持（support.aws.amazon.com 的
Kiro 联系入口）核验身份——这一步需要账号主人出面，建议主线尽快处理。

## 2. Hooks 真实格式样本（`~/workspace/kiroween/hook-sample/`）

试过的路径与结果：

- `kiro-cli agent create sample-agent`：真实生成了 agent 配置脚手架
  （`hook-sample/proj/.kiro/agents/sample-agent.json`），但**模板不含
  hooks 字段**（空模板省略），单靠它拿不到 hooks 格式。该命令写完文件后
  还会进交互编辑，无头环境下挂起，已终止——文件本身完整可用。
- 内置 `kiro_help` agent：无头启动失败（`Mode 'kiro_help' not found`，
  exit 4，v3/v2 均同），此路不通，输出留档。
- **官方 schema + 文档定版**：CLI 二进制内嵌的官方 agent schema 地址
  （amazon-q-developer-cli schemas/agent-v1.json）+ kiro.dev 官方文档
  《Hooks — What's new in 1.0》，并用 3.5.0 二进制 strings 交叉核对
  （Hook 结构体字段 `command` / `matcher` / `timeout_ms` /
  `max_output_size` / `cache_ttl_seconds`；事件枚举 AgentSpawn /
  PreToolUse / PostToolUse / UserPromptSubmit 等均在二进制中出现）。

**定版结论（与 DESIGN 的假设不同，必须更正）：**

- 现行格式是 **v1 独立 JSON 文件**：`.kiro/hooks/*.json`，结构
  `{ "version": "v1", "hooks": [ { "name", "trigger"（PascalCase）,
  "matcher"（正则，可选）, "action": { "type": "command", "command" }
  或 { "type": "agent", "prompt" }, "description"?, "enabled"? } ] }`，
  IDE 1.0 与 CLI 3.x 共用同一格式。
- DESIGN 里规划的 `.kiro.hook`（0.x 的 `when`/`then` 格式）**已被官方
  淘汰：旧文件在新版里不执行、只显示升级徽标**。照原计划写 .kiro.hook
  等于交一批哑弹——本轮已按 v1 落地（见 §3）。
- 文件类触发器：`PostFileSave`（旧 fileEdited）、`PostFileCreate`、
  `PostFileDelete`，matcher 对**文件路径**做正则；且只对 **agent 造成
  的**文件变更触发，不对人手编辑器保存触发（官方触发器表原文口径）。
- 另一路格式（本次未采用）：CLI agent 配置 `.kiro/agents/*.json` 内嵌
  `hooks` 对象，键为 camelCase 事件（agentSpawn / userPromptSubmit /
  preToolUse / postToolUse / stop），值为 `{command}` /
  `{matcher, command}` 数组。

**实证（真加载、真执行）**：在样本项目 `hook-sample/proj/` 放 v1 样本
（SessionStart + PostFileSave 两条 command hook），跑真实
`kiro-cli chat --no-interactive --trust-workspace`：
`hook-fires.log` 落下 `SESSIONSTART-FIRED` —— **CLI 3.5.0 确实加载并
执行了 `.kiro/hooks/*.json`**。随后模型调用撞上 §1 的停用报错，agent
没能写出 probe.txt，**PostFileSave 的实弹触发本轮未能验到**，卡点即
账号停用，与格式无关。

## 3. Hooks 接入 VerdictKit（`.kiro/hooks/`）

按 DESIGN 三件的意图映射到 v1 真触发器（均为 command 动作、项目根目录
执行）：

| 文件 | trigger | matcher | command |
| --- | --- | --- | --- |
| `test-on-save.json` | PostFileSave | `src/.*\.ts$` | `npm test` |
| `citation-lint.json` | PostFileSave | `(fixtures/.*\.json\|out/cards\.json)$` | `npm run demo && npm run lint:citations` |
| `fixture-refresh.json` | PostFileSave | `src/core/.*\.ts$` | `npm run demo && npm test` |

同步更新：`.kiro/hooks/README.md`（格式说明 + 映射表 + 验证状态）、
`.kiro/specs/verdict-core/tasks.md`（hooks 条目标记完成并注明格式更正）。

与 DESIGN 的偏差（如实记录）：
- 文件名由 `*.kiro.hook` 改为 `*.json`（格式淘汰所致，见 §2）。
- test-on-save 跑全量测试：测试套小（15 个）且无按文件选测的工具，
  README 已注明。
- 三个 hook 都是「agent 保存文件时」触发，不是「人保存时」——这是
  v1 触发器的官方语义，演示视频脚本里「现场改一处保存即拦截」的
  镜头需改成 agent 改文件触发，材料阶段要记得改口径。

验证（本机实跑，2026-11-21）：
- 三个 hook 文件 JSON 解析全过；字段与官方 schema 逐项对齐
  （version/hooks/name/trigger/matcher/action）。
- hook 所调命令从仓库根实跑通过：`npm run demo` 四判定与预期一致
  （GO / NO-GO / TRUE / FALSE）；`npm run lint:citations` 输出
  `4 verdict(s) OK`。
- 在 verdictkit 工作区内跑 `kiro-cli chat "/usage"`（带
  --trust-workspace）：CLI 正常加载工作区、无 hooks 解析报错、
  正常返回用量。
- **`npm test` 15/15 全绿；`npm run typecheck`（tsc strict）干净，
  exit 0** —— 接入 hooks 未引入任何回归。
- 本地 git commit（未 push）：见仓库 log（本文件随该提交入库）。

## 还差什么

1. **账号停用解封（最高优先，不在我这轮权限内）**：按报错指引走 Kiro
   支持核验身份。解封前一切「用 Kiro 真建造」动作（按 spec 生成代码、
   hooks 实弹触发演示）都做不了。
2. PostFileSave 三件的实弹触发验证：解封后让 agent 改一个 src 文件、
   一个 fixture，各验一次日志/输出，补进本文件后续日志。
3. 演示视频脚本 §2:20–2:45 的 hooks 镜头口径修正（agent 触发，非人手
   保存）——材料阶段处理。
4. 其余构建窗事项不变：GitHub 公开仓 + 推送、Kiro 按 spec 留痕、
   视频、12-04 提交。

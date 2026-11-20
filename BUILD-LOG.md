# VerdictKit BUILD-LOG

## 2026-11-20 — 核心实现提前建成（原计划 11-28 开工，按「全部提前」新规矩提前）

范围：DESIGN.md 的 verdict-core 引擎 + 两个派生应用主体 + 测试 + .kiro
specs/steering + citation-lint + fixtures + 判定卡静态页。未推 GitHub
（建公开仓属构建窗动作，留主线在 11-28 窗口内与 Kiro CLI 留痕一并办）。

### 交付

- `src/core/`：evidence（模型+校验）/ score（权威×72h 半衰期衰减×互证增量）/
  verdict（规则包接口 + 评估组装 + R4 引用完整性闸）/ render（判定卡数据 + 静态 HTML）
- `src/apps/ship-or-noship.ts`：发布清单→证据适配 + GO/CAUTION/NO-GO 规则包
  （开放阻塞/构建失败 = 硬否决；无构建证据 = CAUTION 不装绿）
- `src/apps/claim-check.ts`：声明+材料→证据适配 + TRUE/UNVERIFIED/FALSE 规则包
  （FALSE 门槛高于 TRUE：≥2 独立反驳源且至少一条权威 ≥2）
- `fixtures/`：GO / NO-GO 清单、TRUE / FALSE 声明包各一；`src/demo.ts` 一键出
  `out/cards.json` + `out/verdict-cards.html`（4 张判定卡）
- `scripts/citation-lint.ts`：R4 闸的脚本本体（hook 接线待 CLI 样例定格式）
- `.kiro/`：specs 三套（骨架 + 两派生、含派生声明）+ steering 三件；
  hooks 目录只有说明文件——格式按 DESIGN 约定等 Kiro CLI 生成样例后再写

### 验证（2026-11-20 本机实跑）

- `npm test`：**15/15 全绿**（core 5 + apps 10，覆盖每应用每个档位、同源不算互证、
  纯函数确定性、引用闸拦截残缺引用）
- `npm run typecheck`（tsc strict + exactOptionalPropertyTypes）：**干净**
  （首轮抓到 ClaimCheck 适配层 filter 不收窄联合类型的真问题，已改循环写法修复并复跑）
- `npm run demo`：4 份判定与预期一致（GO / NO-GO / TRUE / FALSE）
- `npm run lint:citations`：4 份判定引用完整性全过

### 剩余（构建窗 11-28–12-04 内办，不属本次提前范围）

1. 建 GitHub 公开仓并推送（根目录含 /.kiro、MIT 已备）
2. 用 Kiro CLI 按 spec 走一遍生成/修订留痕（「真用 Kiro 建成」的合规口径）
3. hooks 三件按 CLI 生成样例的 schema 落文件并实测拦截一次
4. 演示视频（脚本大纲在 DESIGN.md §4，细化稿可提前）+ 英文提交文案 + Blog 草稿
5. 12-04 白天 Devpost 提交（等 4,000 credits 额度码邮件到后兑换）

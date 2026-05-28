# Docs Index

## 目的

这份索引用来说明 `docs/` 目录下各文档的用途、优先级和推荐阅读顺序。

适用场景：

- 新加入协作者快速了解项目
- 开始新开发任务前确认约束
- 发生文档冲突时判断以哪份为准
- 给 Codex 或其他协作工具提供统一入口

## 文档列表

### [INITIAL_OUTLINE.md](C:/Users/Xinya.li/Documents/Delta%20Project%202/docs/INITIAL_OUTLINE.md)

用途：

- 保存项目最初的大方向、大边界和阶段路线图
- 作为总纲参考，帮助快速理解“这个项目为什么这样做”

特点：

- 信息覆盖广
- 偏路线图和规划说明
- 适合作为项目背景材料

### [PRODUCT_SPEC.md](C:/Users/Xinya.li/Documents/Delta%20Project%202/docs/PRODUCT_SPEC.md)

用途：

- 定义产品目标、目标用户、核心循环、V1 范围和非目标

特点：

- 回答“这个产品第一版到底要做什么、不做什么”
- 用于约束功能膨胀

### [GAME_RULES.md](C:/Users/Xinya.li/Documents/Delta%20Project%202/docs/GAME_RULES.md)

用途：

- 定义挂机、掉落、装备、战力、Boss、排行榜、AI 权限等核心规则

特点：

- 回答“游戏到底按什么规则运行”
- 是核心玩法实现的重要依据

### [TECH_SPEC.md](C:/Users/Xinya.li/Documents/Delta%20Project%202/docs/TECH_SPEC.md)

用途：

- 定义技术栈、目录结构、路由方案、服务职责、测试策略和部署边界

特点：

- 回答“代码应该怎么组织”
- 是工程落地和后续扩展的技术基线

### [CODEX_RULES.md](C:/Users/Xinya.li/Documents/Delta%20Project%202/docs/CODEX_RULES.md)

用途：

- 约束 Codex 或其他 AI 协作者的实现方式和边界

特点：

- 回答“协作开发时哪些事能做，哪些事不能做”
- 尤其用于限制 AI 越权影响游戏数值和结果

### [ACCEPTANCE.md](C:/Users/Xinya.li/Documents/Delta%20Project%202/docs/ACCEPTANCE.md)

用途：

- 定义每个阶段的交付物、验收标准和测试要求

特点：

- 回答“这一阶段什么时候算完成”
- 适合作为任务完成后的核对清单

### [CLOSED_TEST_PLAN.md](C:/Users/Xinya.li/Documents/Delta%20Project%202/docs/CLOSED_TEST_PLAN.md)

用途：

- 记录第 8 阶段封测硬化的模拟命令、检查清单和当前风险结论

特点：

- 回答“封测前还差哪些验证”
- 适合作为真实拉好友试玩前的执行手册

### [DEPLOYMENT_RUNBOOK.md](C:/Users/Xinya.li/Documents/DeltaProject/docs/DEPLOYMENT_RUNBOOK.md)

用途：

- 记录真正把项目部署到公网前需要做的技术改造、部署路线和最终执行命令

特点：

- 回答“怎么让朋友真的连上来玩”
- 重点覆盖数据库、环境变量、邀请码初始化和 `/admin` 安全边界
- 已包含中文最终版部署手册，适用于 `Ubuntu 24.04 + www.ninjala.online + 本机 Postgres + PM2 + Nginx`

### [LAUNCH_CHECKLIST.md](C:/Users/Xinya.li/Documents/DeltaProject/docs/LAUNCH_CHECKLIST.md)

用途：

- 提供邀请朋友前的上线前检查清单

特点：

- 回答“现在能不能真的发给朋友玩”
- 适合作为 go / no-go 核对表

### [HERMES_ONE_SHOT_DEPLOY.md](C:/Users/Xinya.li/Documents/DeltaProject/docs/HERMES_ONE_SHOT_DEPLOY.md)

用途：

- 给已经装好 Hermes 的 Ubuntu 服务器提供一份可直接执行的一站式上线提示词

特点：

- 回答“怎么把文档直接喂给 Hermes，让它帮我上线”
- 包含固定参数、占位符、标准提示词和自检要求

## 文档优先级

当不同文档之间出现描述差异时，按下面顺序理解：

1. `ACCEPTANCE.md`
2. `GAME_RULES.md`
3. `TECH_SPEC.md`
4. `PRODUCT_SPEC.md`
5. `CODEX_RULES.md`
6. `INITIAL_OUTLINE.md`
7. `CLOSED_TEST_PLAN.md`
8. `DEPLOYMENT_RUNBOOK.md`
9. `LAUNCH_CHECKLIST.md`

说明：

- `INITIAL_OUTLINE.md` 是最早期总纲，保留背景和路线图，不作为最终细节裁定依据
- `PRODUCT_SPEC.md` 负责范围边界
- `GAME_RULES.md` 负责玩法规则
- `TECH_SPEC.md` 负责工程实现边界
- `CODEX_RULES.md` 负责协作约束
- `ACCEPTANCE.md` 负责阶段完成定义

## 推荐阅读顺序

### 对项目发起人或新协作者

推荐顺序：

1. `INITIAL_OUTLINE.md`
2. `PRODUCT_SPEC.md`
3. `GAME_RULES.md`
4. `TECH_SPEC.md`
5. `ACCEPTANCE.md`
6. `CODEX_RULES.md`

### 对开始写代码的人

推荐顺序：

1. `PRODUCT_SPEC.md`
2. `GAME_RULES.md`
3. `TECH_SPEC.md`
4. `CODEX_RULES.md`
5. `ACCEPTANCE.md`

### 对开始拆任务给 Codex 的人

推荐顺序：

1. `CODEX_RULES.md`
2. `PRODUCT_SPEC.md`
3. `GAME_RULES.md`
4. `ACCEPTANCE.md`
5. `TECH_SPEC.md`

## 使用建议

### 开始一个新功能前

先确认：

- `PRODUCT_SPEC.md` 里是否属于 V1 范围
- `GAME_RULES.md` 里是否已有规则边界
- `TECH_SPEC.md` 里应该落在哪个目录
- `CODEX_RULES.md` 是否限制了实现方式
- `ACCEPTANCE.md` 这一阶段的验收和测试要求是什么

### 发生实现争议时

按以下问题判断：

- 这是功能范围问题：看 `PRODUCT_SPEC.md`
- 这是玩法公式问题：看 `GAME_RULES.md`
- 这是代码放哪儿的问题：看 `TECH_SPEC.md`
- 这是 AI 能不能做的问题：看 `CODEX_RULES.md`
- 这是是否达到完成标准的问题：看 `ACCEPTANCE.md`

## 推荐后续维护方式

- 如果总方向变化，优先更新 `PRODUCT_SPEC.md`
- 如果玩法公式变化，优先更新 `GAME_RULES.md`
- 如果目录、技术选型或部署方式变化，优先更新 `TECH_SPEC.md`
- 如果协作方式变化，更新 `CODEX_RULES.md`
- 如果阶段标准变化，更新 `ACCEPTANCE.md`
- `INITIAL_OUTLINE.md` 尽量保留其“初始总纲”属性，不频繁改成细节规格

## 当前状态

当前 `docs/` 目录已经具备：

- 项目总纲
- 产品范围
- 游戏规则
- 技术规范
- Codex 协作规则
- 分阶段验收标准

当前实现进度已经不在第 1 阶段，而是已经完成了：

- 第 1-5 阶段主线和移动端收口
- AI 挂机日志的安全增强层
- 世界 Boss 与好友祝福这类轻社交互动
- 分页格子背包、独立强化/锻造/合成标签页
- 主线 Boss / 世界 Boss 分页和结果反馈修正
- 日志、排行、角色装备页也都改成了分页或标签式移动端布局
- 首页和挂机页也统一成了相同的标签式短滚动结构
- 同页标签切换、分页、操作刷新和奖励弹窗关闭现在会尽量保持原滚动位置，不再默认跳回页顶，也不会持续抖动抢滚动
- 登录体系已切到“账号密码登录 + 一次性邀请码注册”，并支持清空现有账号重新封测
- 测试环境现在有方便版 `/admin` 管理台，但只对 `PENGUIN-LI` 邀请码注册的账号开放，可直接重置玩家、补资源、重置全服进度或清空账号
- 等级系统已切到基于总经验的非线性公式成长，理论上限 3000 级
- 第 8 阶段脚本和封测计划文档已经补齐，当前已能跑数值模拟并输出风险警告
- 装备系统已经切到双饰品位，`goldBonus / expBonus / dropBonus / crit / luck` 也都接入了真实结算或战斗逻辑
- 背包和角色页现在会显示装备机制说明卡，解释基础装备、词缀、来源区域和词条来源
- 公网部署方案与上线前检查清单已经补到 `docs/DEPLOYMENT_RUNBOOK.md` 和 `docs/LAUNCH_CHECKLIST.md`
- `DEPLOYMENT_RUNBOOK.md` 里现在也包含了“轻量服务器自托管版”的中文最终命令版，适合用 Node + Nginx + Postgres 自己跑
- `HERMES_ONE_SHOT_DEPLOY.md` 也已经补上，适合让 Hermes 在服务器本机直接一站式执行部署

下一步更适合优先查看：

- `ACCEPTANCE.md` 中第 8 阶段封测硬化要求
- `TECH_SPEC.md` 中模拟脚本、事务边界和环境变量约束
- `README.md` 中最新的当前状态与本地启动说明
- `DEPLOYMENT_RUNBOOK.md` 中的联网部署改造项和 Ubuntu 最终执行命令
- `HERMES_ONE_SHOT_DEPLOY.md` 中给 Hermes 的标准执行提示词

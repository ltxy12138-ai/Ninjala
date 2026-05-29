# 初始大纲

## 文档定位

这份文档用于保存项目最初的整体规划思路，作为后续开发阶段的总纲参考。

使用原则：

- 这是一份高层路线图和项目边界说明
- 详细实现以 `PRODUCT_SPEC.md`、`GAME_RULES.md`、`TECH_SPEC.md`、`CODEX_RULES.md`、`ACCEPTANCE.md` 为准
- 如果后续详细规格与本大纲有冲突，以后续细化文档为准

## 项目定位

项目目标：

- 5 人朋友圈使用的移动网页放置刷宝 RPG
- 技术方式为 Next.js 移动 Web + 数据驱动游戏逻辑 + Codex 辅助开发
- AI 只负责叙事、命名、日志等表现层内容
- AI 不负责掉落、数值、战斗结果或奖励结算

参考方向：

- 可以参考 WorldX 这类“AI 世界生成、角色和故事涌现”的思路
- 但本项目不做开放模拟
- 应该聚焦更稳定、更小、更可玩、更容易上线的小型放置刷宝网页游戏

## 总目标

### 产品目标

核心流程：

```text
打开网页
  -> 邀请码登录
  -> 选择挂机区域
  -> 离线刷怪
  -> 领取金币、经验、装备、材料
  -> 强化角色 / 更换装备
  -> 挑战 Boss
  -> 解锁新区
  -> 查看朋友排行榜和掉落动态
```

### 技术目标

- 前端：Next.js + React + Tailwind CSS
- 后端：Next.js Server Actions / API Routes
- 数据库：SQLite 本地开发，后续可迁移到 Turso 或 Postgres
- ORM：Prisma
- 部署：Vercel
- AI：后期接 OpenAI API，只做日志和文案
- 开发辅助：Codex

## 范围定义

### 第一版必须做

- 邀请码登录
- 玩家创建
- 移动端首页
- 挂机区域
- 离线收益
- 掉落系统
- 背包系统
- 装备系统
- 战力计算
- Boss 挑战
- 区域解锁
- 好友排行榜
- 全服掉落动态
- 基础部署

### 第二版再做

- AI 挂机日志
- AI 装备命名
- AI Boss 背景
- 世界 Boss
- 每日任务
- 好友祝福
- 图鉴
- 套装
- 宠物
- PWA 桌面图标

### 暂时不做

- 充值
- 抽卡
- 交易
- PVP
- 复杂聊天
- 公会
- 实时战斗
- 复杂 Phaser 场景
- 开放世界地图
- 复杂 AI Agent 长期记忆

核心原因：

- 玩家数量只有 5 人
- 重点不是做大系统，而是做一个稳定、可玩、能刷东西、能和朋友比较的小游戏

## 推荐项目结构

```text
idle-friends-rpg/
  app/
    page.tsx
    login/page.tsx
    home/page.tsx
    idle/page.tsx
    inventory/page.tsx
    characters/page.tsx
    boss/page.tsx
    rankings/page.tsx
    logs/page.tsx
    api/
      claim/
      equip/
      boss/
      login/

  components/
    layout/
    game/

  lib/
    db.ts
    auth.ts
    game/
      idle.ts
      loot.ts
      combat.ts
      power.ts
      equipment.ts
      region.ts
      boss.ts
      economy.ts
      random.ts
    ai/
      generateIdleLog.ts
      generateItemName.ts
      validateAIOutput.ts

  prisma/
    schema.prisma
    seed.ts

  data/
    regions.json
    bosses.json
    itemBases.json
    affixes.json
    dropTables.json
    materials.json
    inviteCodes.json

  tests/
    idle.test.ts
    loot.test.ts
    power.test.ts
    combat.test.ts
    boss.test.ts
```

核心组织原则：

- 页面只负责展示
- 游戏规则全部放在 `lib/game`
- 配置全部放在 `data`
- 数据库结构放在 `prisma`
- AI 全部放在 `lib/ai`

## 核心数据模型方向

第一版重点围绕以下模型展开：

- `User`
- `Player`
- `Character`
- `ItemInstance`
- `GameLog`

后续可逐步扩展：

- `MaterialStack`
- `RegionProgress` 或 `PlayerUnlockedRegion`
- `WorldBoss`
- `WorldBossAttackLog`
- `Blessing`

## 游戏设计基线

### 第一版区域

- `region_001` 新手竹林
- `region_002` 冰鱼河
- `region_003` 废弃道场
- `region_004` 雪山矿洞
- `region_005` 魔鹈火山

### 装备部位

- 武器
- 头部
- 衣服
- 鞋子
- 饰品

### 稀有度

- `common`
- `rare`
- `epic`
- `legendary`

### 掉落规则基线

- 普通装备常见
- 稀有装备偶尔出现
- 史诗装备低概率
- 传说装备极低概率，可考虑保底
- 材料稳定产出
- 金币与经验稳定产出

示例权重：

```ts
const rarityWeights = {
  common: 7500,
  rare: 2000,
  epic: 450,
  legendary: 50,
};
```

### 离线收益限制

- 最多累计 12 小时
- 少于 1 分钟不可领取
- 领取时更新 `lastClaimAt`
- 不允许重复领取同一段时间收益

## 开发总路线

建议节奏：

- 第 0 周：准备期
- 第 1 周：项目骨架
- 第 2 周：挂机与掉落
- 第 3 周：装备、战力、背包
- 第 4 周：Boss、区域解锁、排行榜
- 第 5 周：手机体验和部署
- 第 6 周：AI 日志与文案
- 第 7 周：世界 Boss 和朋友互动
- 第 8 周：封闭测试与修复
- 第 9-12 周：内容扩展和长期玩法

## 分阶段摘要

### 第 0 阶段：准备期

目标：

- 把需求冻结成可执行规格
- 避免边做边猜

关键产物：

- `docs/PRODUCT_SPEC.md`
- `docs/GAME_RULES.md`
- `docs/TECH_SPEC.md`
- `docs/CODEX_RULES.md`
- `docs/ACCEPTANCE.md`

### 第 1 阶段：项目骨架

目标：

- 搭出能运行、能登录、能显示移动端页面的基础项目

范围：

- Next.js 初始化
- Tailwind 配置
- Prisma + SQLite
- 邀请码登录
- 玩家创建
- 移动端布局
- 底部导航
- 首页与主页面占位

### 第 2 阶段：挂机与离线收益

目标：

- 做出核心放置循环

范围：

- 区域配置
- 选择挂机区域
- 计算离线时间
- 领取收益
- 金币、经验、材料收益
- 基础日志

### 第 3 阶段：掉落、背包、装备

目标：

- 从“收金币”升级为“刷宝”

范围：

- 装备基础表
- 掉落表
- 装备实例生成
- 背包页
- 装备穿戴
- 战力重算
- 一键装备

战力公式第一版：

```text
power = attack × 2 + defense × 1.5 + hp × 0.2 + luck × 1
```

### 第 4 阶段：Boss、区域解锁、排行榜

目标：

- 建立长期目标链：刷装备 -> 提战力 -> 打 Boss -> 解锁新区

范围：

- Boss 配置
- Boss 挑战
- 胜负计算
- 奖励发放
- 区域解锁
- 战力排行榜
- 稀有掉落动态

Boss 胜率基线：

```text
winChance = clamp(playerPower / bossPower, 0.1, 0.95)
```

### 第 5 阶段：手机体验、部署、稳定性

目标：

- 让朋友能在手机浏览器稳定游玩

范围：

- 移动端 UI 优化
- loading / error UI
- Vercel 部署
- 数据库迁移方案
- 基础日志与备份思路
- 开发环境管理员入口

### 第 6 阶段：AI 日志与文案

目标：

- 加入 AI 特色，但不能影响数值稳定

AI 可做：

- 挂机日志
- 稀有装备命名
- Boss 背景故事
- 每日总结
- 朋友动态文案

AI 不能做：

- 掉落概率
- 装备数值
- Boss 胜负
- 金币产出
- 区域解锁
- 排行榜

### 第 7 阶段：朋友圈互动

目标：

- 让 5 个人之间产生互动，而不是各玩各的

范围：

- 全服动态
- 今日欧皇榜
- 好友祝福
- 世界 Boss
- 最后一击称号
- 每周统计

### 第 8 阶段：封闭测试

目标：

- 在给朋友玩之前清掉明显问题

重点：

- 新玩家流程
- 12 小时挂机流程
- 连续 3 天模拟流程
- 模拟脚本
- 手动测试清单

### 第 9-12 阶段：内容扩展

目标：

- 让 5 个人能玩 2 到 4 周

优先扩展：

- 套装
- 图鉴
- 每日任务
- 每周 Boss
- 称号
- 装备分解
- 材料合成

## Codex 协作工作流

Codex 更适合处理明确的软件任务，而不是一次性生成完整游戏。

推荐拆法：

- 一个功能
- 一个 bug
- 一个测试补充
- 一个重构
- 一个页面
- 一个模型调整

不推荐：

```text
帮我做完整游戏
```

推荐：

```text
实现离线挂机结算，要求最多累计 12 小时，重复点击不能重复领取，并补测试。
```

### 推荐任务模板

```text
任务：
背景：
当前已有：
需要实现：
规则限制：
文件位置：
测试要求：
验收标准：
不要做：
```

## 审查与修 Bug 原则

每个阶段完成后，应重点自查：

- 核心游戏逻辑是否写进页面组件
- 是否存在重复领取收益
- 是否存在装备数值越界
- 是否有空状态未处理
- 是否有移动端显示问题
- 是否有缺失测试
- 是否存在 `any`
- 是否有 AI 越权影响数值和奖励

修 bug 时原则：

- 不重写整个系统
- 只修改必要文件
- 保留现有 API
- 补充回归测试

## 数值模拟方向

后续应准备模拟脚本，例如：

- `scripts/simulate-idle.ts`
- `scripts/simulate-drops.ts`
- `scripts/simulate-players.ts`
- `scripts/simulate-economy.ts`

目标：

- 模拟 5 个玩家
- 模拟 3 天到 14 天挂机
- 输出金币、经验、装备稀有度、战力分布、Boss 进度
- 检查是否出现数值膨胀或极端异常

## 部署方向

上线前准备：

- 检查环境变量
- 创建 `.env.example`
- 更新 README 部署步骤
- 确保 `npm run build` 通过
- 明确 Prisma 生产迁移方式
- 增加健康检查页面或 API
- 禁用生产环境的开发重置入口
- 确保邀请码不会暴露到前端包中

## 第一版内容建议

推荐主题：企鹅忍者村

建议角色：

- 李：前排忍者，偏防御
- 胡：毒镖忍者，偏暴击和奇遇
- 赵：商贸忍者，偏金币和掉落
- 周：铁壁忍者，偏反伤和护盾

建议区域：

- 新手竹林
- 冰鱼河
- 废弃道场
- 雪山矿洞
- 魔鹈火山

建议 Boss：

- 竹林恶犬
- 冰背鲤王
- 道场傀儡
- 矿洞雪怪
- 九日魔鹈

建议装备名：

- 竹刃短刀
- 冰鱼骨盔
- 雪影忍衣
- 矿洞铁靴
- 魔鹈羽饰
- 雷纹竹甲
- 影分身卷轴
- 寒鱼毒镖

## 最小上线标准

达到以下内容即可开始小范围内测：

- 5 个邀请码
- 5 个区域
- 5 个 Boss
- 30 件装备模板
- 20 个词缀
- 5 个材料
- 1 个排行榜
- 1 个全服日志
- 稳定离线收益
- 稳定装备穿戴
- 可访问线上地址
- 手机可玩

上线前必须保证：

- 不能重复领取收益
- 不能重复领取 Boss 奖励
- 不能生成异常超大数值装备
- 不能丢存档
- 不能登录到别人账号
- 不能因为 AI 失败导致奖励失败

## 推荐执行顺序

最建议的启动顺序：

1. 新建 GitHub 仓库
2. 写 `docs/PRODUCT_SPEC.md`
3. 写 `docs/CODEX_RULES.md`
4. 让 Codex 创建项目骨架
5. 本地运行并验收
6. 让 Codex 实现挂机收益
7. 验收和补测试
8. 让 Codex 实现装备系统
9. 调整数值
10. 部署给第一个朋友测试

## 最终原则

这个项目不应该追求“AI 自动生成完整游戏”，而应该追求：

> 一个稳定的放置刷宝游戏底座 + 少量 AI 叙事增强 + 朋友之间的排行榜和动态。

这是范围最可控、最容易借助 Codex 稳定推进，也最有机会在 2 个月内做成并真正让朋友玩起来的方向。

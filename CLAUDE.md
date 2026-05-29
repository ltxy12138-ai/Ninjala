# Ninjala — Project Conventions & Context

> 本文件供 AI 助手使用。更新前确认信息准确性。

## 基本信息

| 项目 | 值 |
|------|-----|
| Repo | https://github.com/ltxy12138-ai/Ninjala.git |
| 名称 | Idle Friends RPG / 企鹅忍者村 |
| 主要语言 | TypeScript |
| 框架 | Next.js 16 App Router |
| 样式 | Tailwind CSS |
| ORM | Prisma |
| 数据库 | PostgreSQL 16 |
| 测试 | Vitest |
| 部署 | 腾讯云上海 Ubuntu 24.04 (212.64.16.20) |

## 生产环境

| 项目 | 值 |
|------|-----|
| 访问地址 | `https://ninjala.online:8743` |
| 项目路径 | `/var/www/Ninjala/` |
| PM2 进程名 | `ninjala` |
| Next.js 端口 | `:3000` |
| 数据库连接 | `postgresql://root:***@127.0.0.1:5432/ninjala?schema=public` |
| Nginx 配置 | `/etc/nginx/sites-enabled/ninjala` |
| SSL | Let's Encrypt (Certbot，自动续期) |

## ⚠️ 关键陷阱

### 1. 非标端口 8743 + CSRF 修复
项目因 ICP 未备案，通过 **8743 端口** 提供 HTTPS。这引发了一个关键问题：
- 浏览器 `Origin` 头带端口 `ninjala.online:8743`
- Nginx 默认 `$host` 不带端口 → Next.js Server Actions CSRF 校验失败

**已修复**：Nginx 使用 `map $server_port` 动态拼 Host：
```nginx
map $server_port $ninjala_host {
    443    $host;
    default $host:$server_port;
}
server {
    listen 8743 ssl;
    proxy_set_header Host $ninjala_host;
    ...
}
```
**改 Nginx 后只需 reload，无需 rebuild。**

### 2. 腾讯云安全组
安全组默认只放行 80/443。8743 端口已在腾讯云控制台手动放行。

### 3. Admin 控制台
`/admin` 仅在 `NODE_ENV !== "production"` 或 `ENABLE_ADMIN_TOOLS=true` 时可见。生产环境需手动启用。

### 4. Git Smart HTTP 被墙（此服务器）
**当前服务器无法通过 git:// 协议连接 GitHub**。`git fetch/pull/clone` 全部超时。
- GitHub REST API (`api.github.com`) 直连正常 ✅
- Git Smart HTTP (`github.com/.../info/refs?service=git-upload-pack`) 超时 ❌
- HTTP/SOCKS5 代理均已失效 ❌

**绕过方案**：走 GitHub API zipball
```bash
# 1. 下载最新代码
curl -sL "https://api.github.com/repos/ltxy12138-ai/Ninjala/zipball/main" \
  -H "Authorization: token <PAT>" -o /tmp/ninjala.zip

# 2. 解压覆盖
unzip -o /tmp/ninjala.zip -d /tmp/ninjala_extract
rsync -av --exclude='.env' --exclude='.git' --exclude='node_modules' \
  --exclude='.next' \
  /tmp/ninjala_extract/ltxy12138-ai-Ninjala-*/ /var/www/Ninjala/

# 3. 构建重启
cd /var/www/Ninjala && npm install && npx prisma generate && \
  npx prisma migrate deploy && npm run build && pm2 restart ninjala
```

## 目录结构

```
app/              # Next.js App Router 页面
components/       # React 组件
│   ├── auth/     # 登录/登出
│   ├── game/     # 游戏 UI 组件
│   │   ├── ItemCard.tsx
│   │   ├── ConfirmModal.tsx       # 通用确认弹窗
│   │   ├── ConfirmActionButton.tsx # 通用确认按钮（forge/craft）
│   │   ├── DismantleAllForm.tsx   # 一键分解确认+提交模块
│   └── layout/   # 布局/导航组件
lib/              # 核心游戏逻辑
│   ├── game/     # 装备、掉落、战斗等
│   ├── ai/       # AI 挂机日志
│   │   ├── idle-log.ts     # 挂机收益AI风味文案
│   │   └── global-log.ts   # 全服事件AI风味文案（稀有掉落、世界Boss）
│   └── admin.ts  # Admin 权限控制 (ADMIN_INVITE_CODE = "PENGUIN-LI")
data/             # 静态数据 (regions, bosses, items 等)
prisma/
├── schema.prisma # 数据库 schema
├── seed.ts       # 种子数据
└── migrations/   # 数据库迁移文件（不在仓库中，仅生产环境）
docs/             # 项目文档（12份）
scripts/          # 模拟脚本
tests/            # 单元测试
```

## 路由清单

- `/home` — 首页与项目状态
- `/admin` — 测试管理台（需权限）
- `/idle` — 挂机区域切换与收益
- `/inventory` — 背包、强化、锻造、重铸、分解
- `/characters` — 角色属性与装备
- `/boss` — Boss 战斗（主线 + 世界）
- `/rankings` — 排行榜与祝福
- `/logs` — 活动日志

## 常用命令

```bash
# 运维
pm2 status                    # 查看进程
pm2 restart ninjala           # 重启
pm2 logs ninjala              # 查看日志

# 重发版（标准流程 — 此服务器 git pull 已失效，见陷阱 #4）
cd /var/www/Ninjala
git pull origin main              # 仅当 git 协议可用时
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart ninjala

# 重发版（绕过方案 — 当 git 被墙时使用，见陷阱 #4）
# 完整命令见上方"关键陷阱 → 4. Git Smart HTTP 被墙"

# 数据库
psql -h 127.0.0.1 -U root -d ninjala

# 邀请码管理：编辑 data/inviteCodes.json → npm run db:seed
```

## 邀请码

- PENGUIN-LI（管理员绑定）
- PENGUIN-HU
- PENGUIN-ZHAO
- PENGUIN-ZHOU
- PENGUIN-GUEST
- PENGUIN-YUE（2026-05-28 新增）

## Git 工作流

- 每个文件单独 commit
- 格式：`<type>: <description>`（feat/fix/refactor/docs/chore）

## 相关文档

- `docs/DEPLOYMENT_RUNBOOK.md` — 完整部署手册
- `docs/HERMES_ONE_SHOT_DEPLOY.md` — Hermes 一站式上线
- `docs/LAUNCH_CHECKLIST.md` — 上线前检查清单
- `docs/CLOSED_TEST_PLAN.md` — 封测计划
- `docs/GAME_RULES.md` — 游戏规则

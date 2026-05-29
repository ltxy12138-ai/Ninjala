# Hermes 一站式上线文档

## 适用场景

这份文档给“已经安装好 Hermes 的 Ubuntu 24.04 轻量服务器”使用。

目标是：你在服务器上打开 Hermes 后，直接把一段标准提示词发给它，让它一站式完成：

1. 检查运行环境
2. 配置本机 Postgres
3. 拉取仓库
4. 写入 `.env`
5. 执行 Prisma migration
6. seed 邀请码
7. build 并启动 Next.js
8. 配置 PM2
9. 配置 Nginx
10. 申请 HTTPS
11. 做一次上线后自检

## 当前项目固定参数

Hermes 执行时应使用下面这些固定信息：

- 项目目录：`/var/www/Ninjala`
- 域名：`www.ninjala.online`
- 仓库地址：`https://github.com/ltxy12138-ai/Ninjala.git`
- 数据库类型：`PostgreSQL`
- 数据库主机：`127.0.0.1`
- 数据库端口：`5432`
- 数据库用户名：`root`
- 数据库名：`Ninjala`
- 进程名：`ninjala`
- 应用端口：`3000`

## 你需要先准备的 3 个值

在把提示词发给 Hermes 之前，你只需要先准备这 3 个值：

1. `DB_PASSWORD`
2. `SESSION_SECRET`
3. `DEEPSEEK_API_KEY`
   说明：可选；如果你暂时不想启用 AI 挂机文案，就留空

建议：

- `DB_PASSWORD`：至少 24 位高强度随机字符串
- `SESSION_SECRET`：至少 32 位随机字符串

## 先决条件

开始前请先确认：

1. 你的域名 `www.ninjala.online` 已经解析到这台服务器公网 IP
2. 服务器可以正常访问 GitHub 和 npm
3. 服务器上 Hermes 已可正常运行
4. 你会用一个有 `sudo` 权限的账户登录服务器

## 推荐执行方式

### 方式一：直接在 Hermes CLI 里执行

在服务器终端里启动 Hermes：

```bash
hermes
```

或者：

```bash
hermes --tui
```

然后把下面这整段提示词原样发给 Hermes。

## 给 Hermes 的标准提示词

把下面内容里的 3 个占位符改成你自己的真实值后，整段发给 Hermes：

```text
你现在是这台 Ubuntu 24.04 服务器上的发布代理。请直接在本机完成 Ninjala 项目的一站式上线，不要只给建议，要实际执行，并在每个大步骤后汇报结果。

固定参数如下：
- 项目目录：/var/www/Ninjala
- 域名：www.ninjala.online
- 仓库地址：https://github.com/ltxy12138-ai/Ninjala.git
- 数据库类型：PostgreSQL
- 数据库主机：127.0.0.1
- 数据库端口：5432
- 数据库用户名：root
- 数据库名：Ninjala
- PM2 进程名：ninjala
- Next.js 端口：3000

请使用以下密钥：
- DB_PASSWORD=把这里替换成你的数据库密码
- SESSION_SECRET=把这里替换成你的会话密钥
- DEEPSEEK_API_KEY=把这里替换成你的DeepSeekKey，没有就留空

执行目标：
1. 检查系统是否为 Ubuntu 24.04，并检查 node、npm、git、nginx、psql、pm2 是否可用
2. 如果缺少依赖，则安装 git、nginx、postgresql、postgresql-contrib、curl、nodejs、pm2
3. 配置本机 Postgres：
   - 创建 root 角色，如果已存在则跳过
   - 为 root 设置我给出的 DB_PASSWORD
   - 创建数据库 Ninjala，如果已存在则跳过
   - 确保数据库 owner 是 root
4. 准备 /var/www 目录并拉取仓库：
   - 如果 /var/www/Ninjala 不存在则 git clone
   - 如果已存在则进入目录并 git fetch、git checkout main、git pull origin main
5. 在项目目录创建或覆盖 .env，写入：
   - DATABASE_URL=postgresql://root:DB_PASSWORD@127.0.0.1:5432/Ninjala?schema=public
   - SESSION_SECRET=我提供的 SESSION_SECRET
   - NODE_ENV=production
   - DEEPSEEK_API_KEY=我提供的值
6. 安装依赖并执行：
   - npm install
   - npx prisma generate --schema prisma/schema.prisma
   - npx prisma migrate deploy --schema prisma/schema.prisma
   - npm run db:seed
   - npm run build
7. 用 PM2 启动项目：
   - 如果 ninjala 进程已存在，先 reload 或 restart
   - 如果不存在，使用 npm -- start 启动，进程名叫 ninjala
   - 执行 pm2 save
8. 配置 Nginx：
   - 创建 /etc/nginx/sites-available/ninjala
   - 反向代理到 http://127.0.0.1:3000
   - server_name 使用 www.ninjala.online 和 ninjala.online
   - 启用站点并禁用 default
   - nginx -t 通过后 reload nginx
9. 如果 certbot 未安装则安装 certbot 和 python3-certbot-nginx
10. 为 www.ninjala.online 和 ninjala.online 申请 HTTPS 证书
11. 做一轮自检并报告：
   - pm2 status
   - systemctl status nginx --no-pager
   - 访问 http://127.0.0.1:3000
   - 访问 https://www.ninjala.online
   - 确认首页和 /idle 至少返回 200 或可渲染页面
12. 如果遇到错误：
   - 先自己排查并修复
   - 不要在中途停止
   - 最后给我一份清晰的结果总结，包含成功项、失败项、修改过的文件、以及下一步建议

执行要求：
- 优先使用非破坏性命令
- 不要删除无关文件
- 不要改业务代码，除非部署被明确阻塞且必须小修
- 如果需要改业务代码，先说明原因再修改
- 所有命令都在当前服务器本机执行
- 每完成一个阶段，输出简短进度
```

## 建议 Hermes 的实际执行顺序

为了让它更稳定，建议 Hermes 按这个顺序做：

1. 系统检查
2. 依赖安装
3. Postgres 配置
4. 代码拉取
5. `.env` 写入
6. Prisma migrate
7. seed
8. build
9. PM2 启动
10. Nginx 配置
11. HTTPS
12. 自检

## 如果你想降低出错率

可以先让 Hermes 只做前半段，再让它做后半段。

### 第一段提示

让它先完成：

- 依赖检查与安装
- Postgres 配置
- 仓库拉取
- `.env` 写入
- `npm install`
- `prisma generate`
- `prisma migrate deploy`
- `npm run db:seed`
- `npm run build`

### 第二段提示

等第一段成功后，再让它完成：

- PM2 启动
- Nginx 配置
- HTTPS
- 公网访问自检

## Hermes 执行后你应该重点看什么

Hermes 跑完以后，你最应该看下面这几项：

1. `pm2 status` 里 `ninjala` 是否是 `online`
2. `sudo nginx -t` 是否通过
3. `https://www.ninjala.online` 是否能打开
4. 登录后 `/idle` 是否能正常打开
5. `npm run db:seed` 是否真的成功写入邀请码

## 常见卡点

### 1. 80/443 端口被占用

Hermes 需要先查谁占用了端口，再决定停服务还是改配置。

### 2. 域名还没解析好

这种情况下 Certbot 会失败，但应用本体不一定有问题。

### 3. Prisma migration 失败

通常要检查：

- `DATABASE_URL` 是否正确
- Postgres 用户权限是否足够
- 当前数据库是否是空库

### 4. PM2 启动了但页面打不开

通常要检查：

- Next.js 是否真的监听 `3000`
- Nginx 反代配置是否正确
- 防火墙是否放行 `80` 和 `443`

## 配套文档

Hermes 这份文档建议和下面两份一起看：

- [部署手册](C:/Users/Xinya.li/Documents/DeltaProject/docs/DEPLOYMENT_RUNBOOK.md)
- [上线检查清单](C:/Users/Xinya.li/Documents/DeltaProject/docs/LAUNCH_CHECKLIST.md)

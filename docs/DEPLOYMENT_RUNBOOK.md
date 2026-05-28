# 部署手册

## 适用对象

这份手册面向当前项目的实际发布场景：

- 服务器系统：`Ubuntu Server 24.04 LTS 64bit`
- 域名：`www.ninjala.online`
- 仓库地址：`https://github.com/ltxy12138-ai/Ninjala.git`
- 运行方式：`Next.js + PM2 + Nginx`
- 数据库：服务器本机 `Postgres`
- 数据库用户名：`root`
- 数据库名：`Ninjala`

这是一份“最终执行版”手册，目标是让项目真正部署到公网，给朋友实际游玩。

## 先说结论

如果你要把现在这个项目稳定放到公网，推荐路线就是：

1. 使用已经切到 `postgresql` 的 Prisma schema
2. 把代码推到 GitHub
3. 在 Ubuntu 服务器上安装 `Node.js + Postgres + Nginx + PM2`
4. 拉取仓库，配置生产环境变量
5. 执行 `prisma migrate deploy`
6. seed 邀请码
7. build 并用 PM2 常驻运行
8. 用 Nginx 反代到 `www.ninjala.online`
9. 用 Certbot 配 HTTPS

## 当前代码状态

这条数据库切换已经在仓库里完成：

- `prisma/schema.prisma` 已统一为 `postgresql`
- 旧的 SQLite 迁移历史已替换为单份 Postgres 基线 migration
- 生产和开发不再分裂成两份 Prisma schema

## 第 0 步：先确认代码已经更新到最新

### 0.1 拉到最新主分支

```bash
git pull origin main
```

### 0.2 检查方言相关代码

上线到 Postgres 前，必须确认以下内容都已经兼容：

- 没有残留 SQLite 专用 raw SQL
- 所有时间、事务、索引逻辑都能在 Postgres 下工作
- 挂机领取、Boss 结算、世界 Boss、祝福、装备、强化、重铸都至少手测一遍

### 0.3 在本地或测试环境先跑通

建议先在本地或一台测试库上验证以下命令：

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run build
```

只有这一步通过后，再进入正式服务器部署。

## 第 1 步：准备服务器

下面开始进入正式部署命令。

### 1.1 更新系统并安装基础软件

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git nginx postgresql postgresql-contrib curl
```

### 1.2 安装 Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1.3 安装 PM2

```bash
sudo npm install -g pm2
```

### 1.4 确认版本

```bash
node -v
npm -v
psql --version
pm2 -v
nginx -v
```

## 第 2 步：配置本机 Postgres

### 2.1 进入 postgres 用户

```bash
sudo -u postgres psql
```

### 2.2 创建数据库与用户

如果你坚持使用数据库用户名 `root`，可以直接执行：

```sql
CREATE ROLE root WITH LOGIN PASSWORD '请改成你自己的强密码';
ALTER ROLE root CREATEDB;
CREATE DATABASE "Ninjala" OWNER root;
\q
```

建议你把密码换成高强度密码，例如 24 位以上随机字符串。

### 2.3 验证数据库连通

```bash
psql "postgresql://root:请改成你自己的强密码@127.0.0.1:5432/Ninjala"
```

能连进去再 `\q` 退出即可。

## 第 3 步：拉取项目代码

### 3.1 创建部署目录

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
```

### 3.2 克隆仓库

```bash
git clone https://github.com/ltxy12138-ai/Ninjala.git
cd /var/www/Ninjala
```

### 3.3 安装依赖

```bash
npm install
```

## 第 4 步：配置生产环境变量

### 4.1 创建生产环境文件

```bash
cat > /var/www/Ninjala/.env <<'EOF'
DATABASE_URL="postgresql://root:请改成你自己的强密码@127.0.0.1:5432/Ninjala?schema=public"
SESSION_SECRET="请改成一段至少32位的随机字符串"
NODE_ENV="production"

# 可选：如果你希望启用 AI 挂机文案，再填写下面两项
# OPENAI_API_KEY="你的OpenAIKey"
# OPENAI_IDLE_LOG_MODEL="gpt-4.1-mini"
EOF
```

### 4.2 生成一个可用的 SESSION_SECRET

可以用下面任一方式生成：

```bash
openssl rand -base64 48
```

或者：

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

把生成结果填到 `.env` 里即可。

## 第 5 步：执行 Prisma 生产初始化

### 5.1 生成 Prisma Client

```bash
cd /var/www/Ninjala
npx prisma generate
```

### 5.2 执行正式 migration

```bash
npx prisma migrate deploy
```

### 5.3 seed 邀请码

```bash
npm run db:seed
```

### 5.4 可选：打开 Prisma Studio 检查数据

如果你只是临时检查，可以在服务器上执行：

```bash
npx prisma studio --browser none --port 5555
```

只建议临时使用，不要长期暴露到公网。

## 第 6 步：构建并启动应用

### 6.1 生产构建

```bash
cd /var/www/Ninjala
npm run build
```

### 6.2 用 PM2 启动

```bash
pm2 start npm --name ninjala -- start
```

### 6.3 设置开机自启

```bash
pm2 save
pm2 startup
```

`pm2 startup` 执行后会回显一条命令，把那条命令再复制执行一次。

### 6.4 检查服务状态

```bash
pm2 status
pm2 logs ninjala
```

默认情况下，应用会监听 `3000` 端口。

## 第 7 步：配置 Nginx 反向代理

### 7.1 新建站点配置

```bash
sudo tee /etc/nginx/sites-available/ninjala > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name www.ninjala.online ninjala.online;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
EOF
```

### 7.2 启用站点

```bash
sudo ln -sf /etc/nginx/sites-available/ninjala /etc/nginx/sites-enabled/ninjala
sudo rm -f /etc/nginx/sites-enabled/default
```

### 7.3 检查并重载 Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 第 8 步：配置 HTTPS

### 8.1 安装 Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 签发证书

```bash
sudo certbot --nginx -d www.ninjala.online -d ninjala.online
```

### 8.3 测试自动续期

```bash
sudo certbot renew --dry-run
```

## 第 9 步：域名解析要求

在你的域名服务商后台，至少要确保：

- `www.ninjala.online` 的 `A` 记录指向这台服务器公网 IP
- `ninjala.online` 的 `A` 记录也建议一起指向同一台服务器公网 IP

如果解析没配好，Certbot 和网页访问都会失败。

## 第 10 步：首次上线后的检查顺序

建议你第一次上线按下面顺序检查：

1. 打开 `https://www.ninjala.online`
2. 打开登录页，确认静态资源正常
3. 用邀请码注册一个新账号
4. 登录账号
5. 进入 `/idle`，确认页面能打开
6. 切换区域并领取一次挂机收益
7. 进入 `/inventory` 查看掉落
8. 进入 `/boss` 打一次 Boss
9. 进入 `/logs` 看日志是否正常
10. 如果保留 `/admin`，确认只有 `PENGUIN-LI` 邀请码注册的账号能进入

## 常用运维命令

### 查看应用日志

```bash
pm2 logs ninjala
```

### 重启应用

```bash
pm2 restart ninjala
```

### 停止应用

```bash
pm2 stop ninjala
```

### 拉取最新代码并重发版

```bash
cd /var/www/Ninjala
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart ninjala
```

### 查看 Nginx 日志

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 查看端口占用

```bash
sudo ss -ltnp | grep 3000
sudo ss -ltnp | grep 80
sudo ss -ltnp | grep 443
```

## 推荐的生产安全边界

### 1. `/admin` 不建议对外公开

当前项目的 `/admin` 主要是测试管理台。最稳妥的生产策略是：

- 要么生产环境直接禁用
- 要么继续只允许 `PENGUIN-LI` 邀请码注册账号访问
- 同时再加一层环境变量开关

### 2. 不要把 Prisma Studio 暴露到公网

`Prisma Studio` 只适合临时本机查看。

### 3. `.env` 不要提交到仓库

需要确保：

- `.env`
- `.env.local`
- 任何带真实密码的配置文件

都不要进入 Git。

## 推荐的上线前准备清单

真正邀请朋友前，建议至少完成以下动作：

1. 手动测一遍注册、登录、挂机、Boss、背包、日志
2. 确认数据库备份方案
3. 确认 `SESSION_SECRET` 已设置且不是弱密码
4. 确认 `DATABASE_URL` 指向本机 Postgres
5. 确认 AI 功能没有也能正常玩
6. 确认邀请码已经 seed 完成
7. 确认 HTTPS 已生效

## 最短复制版

如果你已经完成了 Prisma 的 Postgres 改造，下面这段是最短执行流：

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx postgresql postgresql-contrib curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

sudo -u postgres psql -c "CREATE ROLE root WITH LOGIN PASSWORD '请改成你自己的强密码';"
sudo -u postgres psql -c "ALTER ROLE root CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE \"Ninjala\" OWNER root;"

sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/ltxy12138-ai/Ninjala.git
cd /var/www/Ninjala
npm install

cat > /var/www/Ninjala/.env <<'EOF'
DATABASE_URL="postgresql://root:请改成你自己的强密码@127.0.0.1:5432/Ninjala?schema=public"
SESSION_SECRET="请改成一段至少32位的随机字符串"
NODE_ENV="production"
EOF

npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run build
pm2 start npm --name ninjala -- start
pm2 save

sudo tee /etc/nginx/sites-available/ninjala > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name www.ninjala.online ninjala.online;
    client_max_body_size 20m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/ninjala /etc/nginx/sites-enabled/ninjala
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.ninjala.online -d ninjala.online
```

## 这份手册之外还要看什么

部署完成后，建议继续配合下面两份文档使用：

- `docs/LAUNCH_CHECKLIST.md`
- `docs/CLOSED_TEST_PLAN.md`

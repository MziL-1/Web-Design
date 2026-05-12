# Blog Platform

一个模板驱动的个人博客系统。注册即拥有自己的博客，写 Markdown 文章，发布后获得可分享的链接。

## 功能

- **注册/登录** — 邮箱注册，Credentials 认证
- **个人信息** — 编辑昵称、简介、上传头像（支持 jpg/png/webp/gif/avif，≤5MB）
- **写文章** — Markdown 编辑器，即时发布或保存为草稿
- **博客管理** — 编辑、删除文章，发布/隐藏整个博客
- **发现页** — 首页展示最新已发布博客列表
- **评论** — 访客无需注册即可评论，honeypot + IP 速率限制防垃圾
- **RSS** — 每个博客自动生成 RSS Feed
- **SEO** — 每个页面自动生成 meta/OG tags
- **角色感知** — 同页面访客/站长不同视图，无需后台跳转

## 技术栈

| 层 | 选择 |
|---|---|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | SQLite (dev) / Turso (prod) |
| ORM | Prisma |
| 认证 | NextAuth.js v5 (Auth.js) |
| 渲染 | react-markdown + remark-gfm |
| 图片 | Vercel Blob (prod) / 本地文件系统 (dev) |
| 部署 | Vercel |

## 快速开始

### 环境要求

- Node.js 22+
- npm 10+

### 安装

```bash
# 克隆仓库
git clone git@github.com:MziL-1/Web-Design.git
cd blog-platform

# 安装依赖
npm install --ignore-scripts
npx prisma generate

# 初始化数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 环境变量

创建 `.env` 文件：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key"
BLOB_READ_WRITE_TOKEN=""  # 可选：Vercel Blob token，留空使用本地文件存储
```

### 生产部署

部署到 Vercel 时需要设置以下环境变量：

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | Turso 数据库连接字符串 |
| `AUTH_SECRET` | NextAuth 密钥 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写 token |

## 项目结构

```
src/
├── app/
│   ├── (main)/
│   │   ├── page.tsx              # 首页发现
│   │   └── loading.tsx           # 首页骨架屏
│   ├── register/page.tsx         # 注册页
│   ├── login/page.tsx            # 登录页
│   ├── [username]/
│   │   ├── page.tsx              # 博客页
│   │   ├── loading.tsx           # 博客页骨架屏
│   │   ├── rss.xml/route.ts      # RSS Feed
│   │   └── [postId]/
│   │       ├── page.tsx          # 文章详情页
│   │       └── loading.tsx       # 文章页骨架屏
│   └── api/
│       ├── auth/                 # 注册 + NextAuth
│       ├── profile/              # GET [username] + PUT
│       ├── posts/                # CRUD + 评论
│       ├── comments/             # 删除评论
│       ├── my-posts/             # 站长文章列表
│       ├── discover/             # 发现页 API
│       └── upload/               # 图片上传
├── components/
│   ├── blog/                     # 博客组件
│   ├── modals/                   # 编辑弹窗
│   └── ui/                       # 通用 UI 组件
└── lib/                          # 工具函数
```

## 命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run db:push` | 同步数据库 schema |
| `npm run db:generate` | 生成 Prisma client |
| `npm run db:studio` | 打开 Prisma Studio |
| `npm run test` | 运行测试 |

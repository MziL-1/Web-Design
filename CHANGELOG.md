# CHANGELOG

## v2.0.0 (2026-05-13)

V2 大版本更新：编辑器升级、社交功能、搜索发现。

### 新增功能

- **WYSIWYG 编辑器** — 基于 Milkdown (ProseMirror) 的所见即所得 Markdown 编辑器，输入即渲染
- **文件导入** — 支持拖拽上传 .md / .docx / .doc 文件，自动解析内容发布文章
- **标签系统** — 个人标签（最多 6 个），博客卡片显示标签，标签搜索
- **关注系统** — 关注/取消关注博主，首页「我的关注」信息流
- **搜索功能** — 导航栏搜索框，支持搜索用户、文章、标签，debounce 300ms
- **点赞功能** — 文章点赞/取消，事务防并发，显示点赞数
- **个人信息详情弹窗** — 点击用户名查看关注数、粉丝数、标签
- **首页增强** — 「发现博客」/「我的关注」Tab 切换，蓝线滑动动画

### 架构变更

- 数据模型 5→9 表：新增 Tag, PostTag, ProfileTag, Follow, Like
- 新增 9 条 API 路由：import, search, tags, feed, follow, followers, following, like, likes
- 新增 14 个前端组件，状态管理层 zustand (UI-only)
- API 遵循 V1 错误码规范 (400/401/403/404/409/429/500)

### 破坏性变更

- 个人简介（bio）最大长度从 500 字符改为 50 字符
- 前端显示 bio 为单行截断 (line-clamp-1)

## v1.0.0 (2026-05-12)

博客平台首个正式版本。

### 核心功能

- 邮箱注册/登录，Credentials 认证 + bcrypt 密码哈希
- 站长编辑个人信息（昵称、简介、头像上传）
- 图片上传支持 jpg/png/webp/gif/avif，开发环境存本地文件系统，生产环境 Vercel Blob
- 站长撰写 Markdown 文章，发布/草稿双状态
- 博客发布开关，一键控制整站可见性
- 访客浏览已发布博客，阅读文章（react-markdown 渲染 + GFM 扩展）
- 访客发表评论，无需注册（honeypot + IP 速率限制防垃圾）
- 站长可删除自己博客上的评论
- 首页发现已发布博客列表，含文章数统计
- 每个博客自动生成 RSS Feed
- 每页自动生成 SEO meta/OG tags
- 骨架屏加载态（首页、博客页、文章页）
- Toast 通知 + Modal 弹窗交互
- 角色感知同页面：访客只读 / 站长可编辑
- 权限保护：Middleware 拦截非 GET 写操作，API 验证作者身份

### 技术

- Next.js 15 App Router + TypeScript + Tailwind CSS 4
- Prisma + SQLite（开发）/ Turso（生产）
- NextAuth.js v5 (Auth.js) JWT session
- 输入验证、速率限制、XSS 防护
- ARIA 可访问性标签（Modal dialog、编辑/删除按钮）

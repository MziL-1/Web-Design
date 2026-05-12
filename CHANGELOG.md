# CHANGELOG

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

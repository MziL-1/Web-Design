# 我开发了一个博客平台，一键部署属于你的独立博客

> 网址：[https://ourblog-platform.cn](https://ourblog-platform.cn)

---

## 这是什么？

BlogPlatform 是一个**个人博客搭建平台**。你不用懂代码，不用买服务器，注册账号就能拥有自己的独立博客网站。

核心理念很简单：**在你的平台写好文章 → 你的博客网站自动更新**。

---

## 已实现的功能

### ✍️ Markdown 编辑器
内置 Milkdown 编辑器，支持 Markdown 语法、实时预览。可以直接粘贴图片、拖拽导入 Markdown 文件。

### 📧 邮箱验证注册
用 QQ 邮箱 SMTP 发送 6 位验证码完成注册，Resend 作为备选。防止机器人灌水。

### 🎨 模板市场 + 一键部署
内置「极简技术博客」和「开发者作品集」两个模板。选一个 → 一键 Fork 到你的 GitHub → 导入 Vercel → 粘贴 Deploy Hook URL 回到平台，你的博客就上线了。

### 🔗 发布即同步
在平台写完文章，点击发布，你的博客网站自动重新构建并更新内容。背后通过 Vercel Deploy Hook 触发，带防抖和 SSRF 防护。

### 📡 公开 API + RSS
每个用户自动获得三个公开接口：
- `GET /api/public/profile/{username}` — 个人信息
- `GET /api/public/posts/{username}` — 文章列表
- `GET /api/public/posts/{username}/{postId}` — 文章详情

模板站通过这几个 API 取数据，再加一个 RSS 订阅地址，标准的 SSG 静态博客架构。

### 👤 个人主页
每个用户有自己的博客主页，展示头像、简介、标签、文章列表。支持私信（仿 Telegram 风格聊天界面）、关注、点赞、评论。

### 📱 移动端适配
刚完成的适配：汉堡菜单、搜索框聚焦动画、首页滑动切标签、消息页切换模式。手机浏览体验完整。

### 🔒 安全措施
- 密码 bcrypt 加盐哈希
- API 防 SSRF 攻击
- 内存滑动窗口限流
- 敏感操作身份验证

---

## 还没做 / 需要优化

### 还没做的
- **实时消息**：私信目前是 Mock 数据，没有后端存储和 WebSocket
- **数据分析**：文章阅读量、访问量统计
- **邮件通知**：有人评论/关注/点赞时发邮件提醒
- **图片 CDN**：上传的图片直接存 Vercel Blob，没有压缩和 CDN 加速
- **一键部署**：模板部署目前需要用户自己操作 GitHub Fork 和 Vercel 导入，流程偏长
- **多语言**：目前仅支持中文
- **GraphQL API**：模板站目前用 REST 拉全量文章列表，改成 GraphQL 可减少请求体积

### 需要优化的
- **搜索**：目前只返回 3 个用户 + 3 篇文章，需要分页和完善排序
- **首屏加载**：首页 SSR 有多处数据库查询，可以加缓存
- **模板站性能**：`output: "export"` 下所有动态路由需要 `generateStaticParams`，构建时间随文章量线性增长
- **错误处理**：部分 API 的错误信息可以更友好
- **SEO**：Meta 标签和 Open Graph 还可以更细致

---

## 未来可做的事

1. **模板生态**：更多模板（摄影博客、文档站、技术 Wiki），做成类似 Ghost/Notion 的模板市场
2. **自托管部署**：除了 Vercel，支持部署到 Netlify、Railway、自己的服务器
3. **团队博客**：多人协作写作，编辑审核流程
4. **Webhook 能力**：不局限于 Vercel，支持通用 Webhook URL 触发任意 CI/CD
5. **自定义域名托管**：在平台内完成域名购买和 DNS 配置，一步到位
6. **AI 写作助手**：内置 AI 摘要生成、文章润色、标题建议

---

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 15 App Router |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | Turso (libSQL) + Prisma |
| 认证 | NextAuth v5 + 邮箱验证码 |
| 编辑器 | Milkdown (ProseMirror) |
| 部署 | Vercel + Deploy Hooks |
| 邮件 | QQ SMTP + Resend 备选 |
| 状态 | Zustand |
| 动效 | Motion (Framer Motion) |

---

## 写在最后

这是一个周末项目，从零到上线大概花了一周时间。写代码最大的正反馈就是：**写完文章，刷新自己的博客站，看到内容真的出现了**。

如果你也想搭一个属于自己的独立博客，欢迎来试试：

👉 **[https://ourblog-platform.cn](https://ourblog-platform.cn)**

有问题或建议，欢迎在平台内私信或提 GitHub Issue。

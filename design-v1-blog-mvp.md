# 个人网站搭建系统 — 设计文档 v1.1

> 生成时间: 2026-05-10 / 更新时间: 2026-05-11
> 审查: CEO Review (SELECTIVE EXPANSION) — 纳入 6 项扩展
> 目标: 学习/练手，覆盖全栈流程
> 交付方式: 平台托管（Vercel）

---

## 1. 产品概述

一个模板驱动的个人网站搭建系统。v1 聚焦**一个博客模板**的最简可用版本。

**v1 做什么：**
- 用户注册/登录
- 站长在自己的博客页面上直接编辑个人信息（名字、简介、头像上传）
- 站长在自己的博客页面上直接写文章（Markdown）、编辑、删除
- 站长发布博客后，获得一个可分享的链接 `/[username]`
- 访客浏览公开博客，可以发表评论（含反垃圾保护）
- 博客支持 RSS Feed、基础 SEO（meta/OG tags）
- 首页展示最新博客列表（发现入口）

**v1 不做什么：**
- 不做多模板（只有博客）
- 不做静态文件导出
- 不做自定义域名
- 不做拖拽编辑
- 不做评论回复/嵌套（v1 扁平评论即可）
- 不做评论通知/点赞

---

## 2. 用户流程

```
=== 站长视角 ===
用户访问首页 → 注册/登录
  ↓
登录后自动跳转到自己的博客页 /[自己的username]
  ↓
博客页面上直接显示「编辑个人信息」按钮 → 弹窗编辑（名字/简介/头像上传）
  ↓
博客页面上直接显示「写文章」按钮 → 弹窗写标题+正文（Markdown）
  ↓
每篇文章旁边有「编辑」「删除」按钮
  ↓
顶部有「发布」开关 → 打开后博客对访客可见


=== 访客视角 ===
访问首页 → 看到最新博客列表
  ↓
点击某个博客卡片 → 访问 /某个用户名
  ↓
看到已发布的博客（个人信息 + 文章列表）
  ↓
点击文章 → 查看全文（Markdown 渲染）
  ↓
文章底部有评论区 → 输入昵称+内容 → 发表评论（honeypot 反垃圾）
  ↓
看到自己和别人的评论
  ↓
可订阅 RSS Feed /[username]/rss.xml
```

**核心设计原则：同一个页面 `/[username]`，根据角色不同显示不同功能。**
- 访客：只读内容 + 可评论 + 可订阅 RSS
- 站长（登录且是本人）：内容可编辑 + 可管理评论

---

## 3. 技术栈

| 层 | 选择 | 理由 |
|---|---|---|
| 框架 | Next.js 15 (App Router) | 全栈一体，API Routes 直接写在项目里，SSR/SSG 都支持 |
| 语言 | TypeScript | 类型安全，前端后端统一 |
| 样式 | Tailwind CSS 4 | 快速写模板，学习成本低 |
| 数据库 | Turso (SQLite 兼容) + Prisma | Vercel Serverless 兼容，免费额度够用，保留 SQLite 开发体验 |
| 认证 | NextAuth.js v5 (Auth.js) | 社区标准，Credentials provider（bcrypt 哈希） |
| 内容 | textarea 输入 + react-markdown 渲染 | 用户体验好，纯文本存储，前端渲染 |
| 图片存储 | Vercel Blob | 免费 10GB，与 Vercel 部署原生集成 |
| 部署 | Vercel（免费） | 一键部署，无需运维 |

---

## 4. 约束与规范

### 4.1 Username 规则
- 字符集：`[a-z0-9_-]`（小写字母、数字、下划线、连字符）
- 长度：3-30 字符
- 保留字黑名单（不可注册）：`login`, `register`, `api`, `admin`, `settings`, `dashboard`, `blog`, `post`, `rss`, `feed`, `404`, `_next`, `favicon`

### 4.2 输入验证规范

| 字段 | 最小长度 | 最大长度 |
|---|---|---|
| username | 3 | 30 |
| email | 5 | 255 |
| password | 6 | 128 |
| displayName | 1 | 50 |
| bio | 0 | 500 |
| post.title | 1 | 200 |
| post.content | 0 | 50000 |
| comment.authorName | 1 | 30 |
| comment.content | 1 | 2000 |

### 4.3 XSS 防护策略
- 所有用户输入为纯文本，不存储 HTML
- `react-markdown` 默认不解析原始 HTML 标签
- 后端不做 HTML 清理（前端渲染层已防护），但需验证输入长度
- 头像 URL 白名单校验（仅允许 https:// 开头）

### 4.4 API 错误码规范

| 状态码 | 场景 |
|---|---|
| 200 | 成功 |
| 400 | 输入验证失败（缺少字段、格式错误、长度超限） |
| 401 | 未登录（需要登录的操作） |
| 403 | 已登录但无权限（非本人操作他人资源） |
| 404 | 资源不存在（用户/文章/评论未找到） |
| 409 | 冲突（username/email 已注册） |
| 429 | 速率限制（评论/注册频繁） |
| 500 | 服务器内部错误 |

### 4.5 速率限制（反垃圾）
- 评论发表：每 IP 每分钟最多 5 条
- 注册：每 IP 每小时最多 3 个账号
- 前端 honeypot：评论区包含隐藏字段 `<input name="website" style="display:none" tabindex="-1" autocomplete="off">`，后端若该字段非空则静默丢弃

---

## 5. 数据模型

### User
| 字段 | 类型 | 说明 |
|---|---|---|
| id | String (cuid) | 主键 |
| username | String (unique) | 唯一用户名，也是博客路径，3-30字符 [a-z0-9_-] |
| email | String (unique) | 邮箱 |
| password | String | 哈希密码（bcrypt，Credentials provider） |
| createdAt | DateTime | |

### Profile（1:1 User）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | String | |
| userId | String (unique) | 关联 User |
| displayName | String | 博客头部的显示名，1-50字符 |
| bio | String? | 个人简介，支持 Markdown，最长 500 字符 |
| avatarUrl | String? | 头像 URL（外链或上传后的 Vercel Blob URL） |
| sitePublished | Boolean (default: false) | 博客是否对访客可见 |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Post
| 字段 | 类型 | 说明 |
|---|---|---|
| id | String | |
| userId | String | 作者 |
| title | String | 文章标题，1-200字符 |
| content | String (Text) | 文章正文（Markdown 原文），最长 50000 字符 |
| published | Boolean (default: true) | 单篇文章是否可见（注意：sitePublished=false 时全部不可见） |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Comment
| 字段 | 类型 | 说明 |
|---|---|---|
| id | String | |
| postId | String | 属于哪篇文章 |
| authorName | String | 评论者昵称，1-30字符 |
| content | String (Text) | 评论内容（纯文本），最长 2000 字符 |
| createdAt | DateTime | |

**关系 & 级联删除：**
```
User 1:1 Profile   → onDelete: Cascade（删 User 自动删 Profile）
User 1:N Post      → onDelete: Cascade（删 User 自动删所有 Post）
Post 1:N Comment   → onDelete: Cascade（删 Post 自动删所有 Comment）
```

注意 Comment 不和 User 关联——v1 访客无需注册就能评论，只需填昵称。

---

## 6. API 设计

### 认证
| 方法 | 路径 | 说明 | 错误码 |
|---|---|---|---|
| POST | /api/auth/register | 注册（email+password+username） | 400/409 |
| POST | /api/auth/[...nextauth] | NextAuth 处理登录/session | 401 |

### 图片上传
| 方法 | 路径 | 说明 | 错误码 |
|---|---|---|---|
| POST | /api/upload | 需登录：上传头像图片（最大 2MB，jpg/png/webp） | 400/401 |

### Profile（权限：读公开，写仅本人）
| 方法 | 路径 | 说明 | 错误码 |
|---|---|---|---|
| GET | /api/profile/[username] | 公开：获取某用户的 Profile | 404 |
| PUT | /api/profile | 需登录：更新本人 Profile（含 avatarUrl） | 400/401 |

### Posts（权限：读公开/全部，写仅本人）
| 方法 | 路径 | 说明 | 错误码 |
|---|---|---|---|
| GET | /api/posts?username=xxx | 公开：获取某用户已发布的文章列表 | 404 |
| GET | /api/posts/[id] | 公开：获取单篇文章详情（含评论数） | 404 |
| POST | /api/posts | 需登录：创建文章 | 400/401 |
| PUT | /api/posts/[id] | 需登录且本人：更新文章 | 400/401/403/404 |
| DELETE | /api/posts/[id] | 需登录且本人：删除文章 | 401/403/404 |

### Comments
| 方法 | 路径 | 说明 | 错误码 |
|---|---|---|---|
| GET | /api/posts/[id]/comments | 公开：获取某篇文章的评论列表 | 404 |
| POST | /api/posts/[id]/comments | 公开：发表评论（需昵称+内容，含反垃圾） | 400/404/429 |
| DELETE | /api/comments/[id] | 需登录：站长可删除自己博客上的评论 | 401/403/404 |

### 我的文章（站长专用）
| 方法 | 路径 | 说明 | 错误码 |
|---|---|---|---|
| GET | /api/my-posts | 需登录：获取本人的全部文章（含未发布的） | 401 |

### RSS Feed
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /[username]/rss.xml | 公开：博客 RSS Feed（仅已发布的文章） |

### 发现（首页）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/discover | 公开：获取最新已发布博客列表（分页，每页 12 个） |

---

## 7. 页面结构 & 交互说明

```
/                       首页/落地页（最新博客发现列表）
/register               注册页
/login                  登录页
/[username]             博客页（核心页面，角色不同行为不同）
/[username]/rss.xml     RSS Feed（XML）
/[username]/[postId]    文章详情页
```

### `/[username]` 页面逻辑（核心）

```
服务端判断：
  ├── 博客未发布 且 访问者不是站长 → 「暂未发布」提示（非 404，保留友好提示）
  ├── 博客已发布 或 访问者是站长本人
  │     ├── 访客模式：
  │     │     - 看到站长信息（只读）
  │     │     - 看到已发布文章列表（只读）
  │     │     - 点击文章进入详情 → 底部有评论区
  │     └── 站长模式（session.user.username === url参数）：
  │           - 个人信息旁边显示「编辑」按钮 → 弹窗编辑
  │           - 文章列表顶部显示「写文章」按钮 → 弹窗创建
  │           - 每篇文章旁显示「编辑」「删除」按钮
  │           - 顶部显示「发布/取消发布」开关
  │           - 草稿文章灰色显示，仅站长可见
  └── 需要登录才能看自己的 → 自动跳转登录页
```

### 空状态设计

| 场景 | 显示内容 |
|---|---|
| 新注册用户，博客为空 | "还没有文章，点击「写文章」开始创作" |
| 发布后无文章 | "这个博客还没有文章" |
| 文章无评论 | "暂无评论，来说点什么吧" |
| 首页无博客 | "还没有人发布博客，成为第一个！" |

### `/[username]/[postId]` 页面逻辑

```
  ├── 访客模式：阅读全文（Markdown 渲染） + 评论区（查看 + 发表，含 honeypot）
  └── 站长模式：可编辑文章 + 可删除评论
```

### 交互方式（v1 用弹窗/面板）

| 操作 | 方式 |
|---|---|
| 编辑个人信息 | 点击「编辑」→ 弹出 Modal，编辑名字/简介/上传头像 |
| 写文章 | 点击「写文章」→ 弹出 Modal，标题 input + 内容 textarea（Markdown 提示） |
| 编辑文章 | 点击文章旁「编辑」→ 弹出 Modal，预填当前内容 |
| 删除文章 | 点击「删除」→ 确认弹窗 → 确认后删除 |
| 评论提交 | 表单含隐藏 honeypot 字段，提交后显示成功/速率限制提示 |

**为什么不用传统后台？** 站长直接在自己的博客上看效果，编辑完即时刷新，不需要在两个页面间跳来跳去。

### SEO 要求

每个页面必须包含：
- `<title>` 标签（首页：系统名 / 博客页：displayName / 文章页：文章标题）
- `<meta name="description">`（博客页：bio 截取 / 文章页：正文截取前 160 字符）
- Open Graph tags（`og:title`, `og:description`, `og:image` 取头像 URL）
- 博客页加 `<link rel="alternate" type="application/rss+xml">` 指向 RSS Feed

---

## 8. 文件结构

```
project/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 根布局（导航栏 + SEO meta）
│   │   ├── page.tsx                # 首页（最新博客发现列表）
│   │   ├── register/page.tsx       # 注册页
│   │   ├── login/page.tsx          # 登录页
│   │   ├── [username]/
│   │   │   ├── page.tsx            # 博客首页（个人信息+文章列表+站长编辑入口）
│   │   │   ├── rss.xml/route.ts    # RSS Feed Route Handler
│   │   │   └── [postId]/
│   │   │       └── page.tsx        # 文章详情页（全文+评论区）
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   └── [...nextauth]/route.ts
│   │       ├── upload/
│   │       │   └── route.ts          # POST 头像上传
│   │       ├── profile/
│   │       │   ├── route.ts          # PUT 本人
│   │       │   └── [username]/route.ts
│   │       ├── posts/
│   │       │   ├── route.ts          # POST 创建
│   │       │   └── [id]/
│   │       │       ├── route.ts      # GET/PUT/DELETE
│   │       │       └── comments/
│   │       │           └── route.ts  # GET/POST
│   │       ├── comments/
│   │       │   └── [id]/route.ts     # DELETE
│   │       ├── my-posts/
│   │       │   └── route.ts
│   │       └── discover/
│   │           └── route.ts          # GET 最新博客列表
│   ├── components/
│   │   ├── blog/
│   │   │   ├── BlogLayout.tsx        # 博客页整体布局
│   │   │   ├── BlogHeader.tsx        # 博客头部（姓名+简介+头像，站长模式可编辑）
│   │   │   ├── BlogPostList.tsx      # 文章列表（站长模式有操作按钮）
│   │   │   ├── BlogPostCard.tsx      # 单篇文章卡片（首页/博客列表复用）
│   │   │   ├── BlogPostContent.tsx   # 文章全文展示（react-markdown）
│   │   │   ├── CommentSection.tsx    # 评论区组件（列表+发表表单+honeypot）
│   │   │   ├── CommentItem.tsx       # 单条评论
│   │   │   └── EditButton.tsx        # 编辑/删除按钮（仅站长可见）
│   │   ├── modals/
│   │   │   ├── EditProfileModal.tsx  # 编辑个人信息弹窗（含头像上传）
│   │   │   ├── CreatePostModal.tsx   # 写文章弹窗
│   │   │   └── EditPostModal.tsx     # 编辑文章弹窗
│   │   └── ui/
│   │       ├── Modal.tsx
│   │       ├── Button.tsx
│   │       ├── FileUpload.tsx        # 图片上传组件
│   │       └── EmptyState.tsx        # 空状态提示组件
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth 配置 + getServerSession
│   │   ├── prisma.ts                 # Prisma 单例客户端
│   │   ├── validation.ts             # 输入验证工具（长度/username/URL）
│   │   ├── rate-limit.ts             # IP 速率限制工具
│   │   └── blob.ts                   # Vercel Blob 上传工具
│   └── middleware.ts                 # 路由保护
├── .env
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 9. 权限规则总结

| 操作 | 访客 | 登录但非站长 | 站长本人 |
|---|---|---|---|
| 看博客 | ✅（已发布） | ✅ | ✅（含草稿） |
| 评论 | ✅（受速率限制） | ✅ | ✅ |
| RSS 订阅 | ✅ | ✅ | ✅ |
| 编辑个人信息 | ❌ | ❌ | ✅ |
| 写/编辑/删文章 | ❌ | ❌ | ✅ |
| 删评论 | ❌ | ❌ | ✅ |
| 发布/取消发布 | ❌ | ❌ | ✅ |
| 上传头像 | ❌ | ❌ | ✅ |

**实现方式：**
- 前端：通过 `useSession()` 获取当前用户，对比页面 URL 中的 username，决定是否显示编辑按钮
- 后端：每个写操作的 API Route 中通过 `getServerSession()` 验证身份，非本人返回 403

---

## 10. 开发路线

### 阶段 1：地基（预计 1.5-2 天）
1. 初始化 Next.js + TypeScript + Tailwind 项目
2. 配置 Prisma + Turso，定义全部数据模型（User/Profile/Post/Comment，含 cascade delete）
3. 配置 Turso 数据库（创建数据库 + 获取连接 URL + token）
4. 跑 `prisma db push` 建表
5. 实现 `lib/validation.ts`（输入验证工具）
6. 实现 `lib/rate-limit.ts`（IP 速率限制）
7. 实现 `lib/blob.ts`（Vercel Blob 上传包装）
8. 配置 NextAuth.js（Credentials provider + bcrypt）
9. 实现注册/登录 API + 页面
10. 实现根布局（导航栏 + SEO meta 默认值）

**验证标准：** 能注册（username 保留字/字符校验）、登录、登出，导航栏随状态变化。

### 阶段 2：博客展示 + 评论（预计 1.5-2 天）
11. 实现 Profile 公开读取 API `/api/profile/[username]`
12. 实现公开博客首页 `/[username]`（展示个人信息+已发布文章列表+空状态）
13. 实现文章详情 API `/api/posts/[id]`
14. 实现文章详情页 `/[username]/[postId]`（react-markdown 渲染+SEO meta）
15. 实现评论 API（获取列表 + 发表含 honeypot 反垃圾 + 速率限制）
16. 实现评论区组件（列表 + 发表表单 + honeypot 隐藏字段）
17. 实现 RSS Feed `/[username]/rss.xml`

**验证标准：** 访客访问 /username 看到博客（含空状态）；点击文章看到 Markdown 渲染全文+评论区；能发表评论（含防重复提交）；RSS 可订阅。

### 阶段 3：站长编辑 + 图片上传（预计 2-2.5 天）
18. 实现头像上传 API `POST /api/upload`（Vercel Blob，2MB/格式限制）
19. 实现 `FileUpload` 组件
20. 实现 Profile 写 API（PUT，仅本人）
21. 实现 Post CRUD API（创建/编辑/删除，仅本人，含输入验证）
22. 实现 `GET /api/my-posts`（本人全部文章含草稿）
23. 实现 EditProfileModal 组件（含头像上传）
24. 实现 CreatePostModal / EditPostModal 组件
25. 在 `/[username]` 页面上集成编辑按钮（条件渲染）
26. 实现「发布/取消发布博客」开关
27. 实现评论删除（站长可删自己博客上的评论）

**验证标准：** 站长登录后在博客页上能上传头像、编辑个人信息、写文章(Markdown)、编辑/删除文章、发布/隐藏博客、删除评论。

### 阶段 4：首页 + SEO + 收尾（预计 1 天）
28. 实现 `GET /api/discover`（最新已发布博客分页列表）
29. 实现首页发现页面（博客卡片列表 + 空状态）
30. 逐页检查 SEO meta/OG tags
31. 部署到 Vercel（配置 Turso 环境变量 + Blob token）
32. 写 README（含搭建说明 + 环境变量清单）

**总预估：6-7.5 天（学习节奏，含 6 项扩展）**

---

## 11. 后续迭代（v2+ 方向）

- 多模板支持（作品集、简历）
- 静态 HTML 导出下载
- 自定义域名
- 拖拽编辑
- Markdown 语法高亮 / 实时预览
- 主题色/字体配置
- 评论回复/嵌套
- 评论通知（邮件）
- 点赞功能
- 全文搜索

---

## 12. 技术决策记录

| 决策 | 选择 | 理由 |
|---|---|---|
| 架构 | 前后台合一（同页面） | 站长所见即所得，无需跳来跳去；条件渲染+权限控制 |
| 数据库 | Turso（SQLite 兼容） | Vercel Serverless 兼容，保留 SQLite 开发体验，免费额度 |
| 认证 | NextAuth.js Credentials + bcrypt | 最简方案，v1 不需要 OAuth |
| 密码存储 | bcrypt 哈希（非加密） | 密码不可逆，安全性正确 |
| 内容编辑 | textarea + react-markdown | 纯文本存储+XSS安全，前端渲染 Markdown |
| 图片存储 | Vercel Blob | 免费 10GB，原生集成 |
| 部署 | Vercel | Next.js 原生支持，免费额度够用 |
| 模板引擎 | React 组件 | 类型安全，灵活度高 |
| 前台编辑 | Modal 弹窗 | 实现简单，体验够用 |
| 评论关联 | Comment ↔ Post（不关联 User） | v1 访客无需注册即可评论 |
| 反垃圾 | honeypot + IP 速率限制 | 轻量有效，零第三方依赖 |
| SEO | Next.js metadata API + OG tags | 原生支持，零额外成本 |

---

## 13. CEO Review 记录

| 审查项 | 结果 |
|---|---|
| 数据库方案修正 | SQLite → Turso（解决 Vercel 不兼容问题） |
| 密码存储修正 | "加密" → "哈希"（bcrypt） |
| XSS 防护策略 | 明确纯文本 + react-markdown 不解析 HTML |
| username 路由保护 | 添加保留字黑名单 + 字符集/长度限制 |
| 输入验证规范 | 新增各字段 min/max 约束表 |
| API 错误码 | 新增统一错误码规范 |
| 级联删除 | Prisma schema 配置 onDelete: Cascade |
| 空状态 UI | 新增 4 种空状态文案 |
| **扩展-图片上传** | 纳入 v1（Vercel Blob） |
| **扩展-RSS Feed** | 纳入 v1（Route Handler） |
| **扩展-Markdown 渲染** | 纳入 v1（react-markdown） |
| **扩展-首页发现** | 纳入 v1（最新博客列表） |
| **扩展-评论反垃圾** | 纳入 v1（honeypot+速率限制） |
| **扩展-基础 SEO** | 纳入 v1（meta/OG tags） |

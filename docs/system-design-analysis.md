# BlogPlatform 系统设计分析报告

> 分析日期：2026-05-24  
> 版本：v2.0.0  
> 技术栈：Next.js 15 + TypeScript + Prisma + Turso + Tailwind CSS 4

---

## 一、架构概览

```
┌──────────────────────────────────────────────────────┐
│                    用户浏览器                          │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐ │
│  │ 平台前端  │  │ 模板博客站 │  │ 消息页  │  │ 部署面板 │ │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  └────┬────┘ │
└───────┼─────────────┼───────────┼───────────┼───────┘
        │             │           │           │
   ┌────▼─────────────▼───────────▼───────────▼───────┐
   │              Vercel (平台部署)                      │
   │  ┌──────────┐  ┌───────────┐  ┌───────────────┐  │
   │  │ Next.js   │  │ NextAuth  │  │ Vercel Blob   │  │
   │  │ App Router│  │ v5 (JWT)  │  │ (图片存储)     │  │
   │  └─────┬─────┘  └───────────┘  └───────────────┘  │
   │        │                                          │
   └────────┼──────────────────────────────────────────┘
            │
   ┌────────▼──────────────────────────────────────────┐
   │              外部服务                                │
   │  ┌────────┐  ┌────────┐  ┌──────────────────────┐ │
   │  │ Turso  │  │ SMTP   │  │ Vercel API           │ │
   │  │ (数据库)│  │ (邮箱)  │  │ (创建项目/触发部署)    │ │
   │  └────────┘  └────────┘  └──────────────────────┘ │
   └───────────────────────────────────────────────────┘
```

**部署架构**：平台本身部署在 Vercel（`ourblog-platform.cn`），用户的模板博客也部署在 Vercel（各自的项目）。数据库使用 Turso 云 SQLite，共享同一个库。

---

## 二、数据模型分析

### 2.1 ER 图

```
User ──1:1── Profile ──M:N── Tag (ProfileTag)
  │
  ├──1:N── Post ──M:N── Tag (PostTag)
  │         │
  │         ├──1:N── Comment
  │         └──M:N── User (Like)
  │
  ├──M:N── User (Follow: follower/following)
  │
  ├──1:1── SiteDeployment
  │
  ├──1:N── Message (sentMessages)
  └──1:N── Message (receivedMessages)
```

### 2.2 模型评价

| 方面 | 评价 | 说明 |
|------|------|------|
| **User** | ✅ 合理 | 基础字段完备，通过 Profile 分离展示数据 |
| **Profile** | ✅ 合理 | 1:1 分离，更新时不锁 User 表 |
| **Post** | ✅ 合理 | coverImage 可空，content 存 Markdown 原文 |
| **Comment** | ⚠️ 有风险 | `authorName` 存字符串而非关联 User，无法做评论者身份追溯；已登录用户评论由前端自动填充，可被伪造 |
| **Follow** | ✅ 合理 | 复合唯一约束防止重复关注 |
| **Like** | ✅ 合理 | 复合唯一约束，点赞/取消用 upsert |
| **SiteDeployment** | ⚠️ 需关注 | `vercelToken` 明文存储在 DB 中，是最高安全风险点 |
| **Message** | ✅ 合理 | read 字段 + 复合索引支持未读计数查询 |
| **RateLimit** | ⚠️ 应该清理 | 表已存在但限流改用内存实现了，此表成僵尸数据 |
| **EmailVerification** | ✅ 合理 | 过期时间 + used 标记防止验证码重用 |

### 2.3 索引分析

| 表 | 索引 | 命中场景 |
|----|------|----------|
| Message | `(receiverId, read, createdAt)` | 未读消息计数 ✅ |
| Message | `(senderId, receiverId, createdAt)` | 两人对话查询 ✅ |
| RateLimit | `(ip, action, createdAt)` | 限流查询（已废弃）|
| EmailVerification | `(email, createdAt)` | 验证码查找 ✅ |

---

## 三、API 设计分析

### 3.1 端点分类（共 30 个处理器）

| 类别 | 数量 | 端点 |
|------|------|------|
| 认证 | 3 | register, send-code, [...nextauth] |
| 用户/资料 | 3 | profile, profile/[username], upload |
| 文章/内容 | 8 | posts CRUD, like, comments CRD, my-posts, feed |
| 社交 | 4 | follow, followers, following, likes |
| 搜索/发现 | 3 | search, discover, tags |
| 消息 | 3 | messages CR+sent, unread-count |
| 部署 | 5 | deployment CRUD, auto-deploy, sync, fix-hook |
| 公开 API | 3 | public/profile, public/posts, public/posts/[id] |

### 3.2 RESTful 评价

| 方面 | 评价 |
|------|------|
| 命名规范 | ✅ 良好：`/api/posts/[id]/like` 而非 `/api/like-post` |
| 幂等性 | ✅ Like/Follow 用 upsert 实现幂等切换 |
| 错误码 | ⚠️ 基本合格，但部分端点错误信息为中文，国际化困难 |
| 分页 | ⚠️ 部分端点（posts, discover）用 `take` 限制但无 cursor，翻到后面页性能下降 |

### 3.3 认证架构

```
请求 → middleware.ts → 非公开 API? → 否 → 放行
                ↓ 是
         auth() → 无 session? → 401
                ↓ 有
         业务逻辑（所有权校验在 handler 内做）
```

**评价**：
- ✅ middleware 做粗粒度鉴权（是否有登录态），handler 做细粒度（是否文章拥有者）
- ⚠️ middleware 用字符串 `path.includes()` 匹配，新增 API 容易遗漏
- ✅ JWT 30 天有效期，无 refresh token（MVP 可接受）

---

## 四、前端架构分析

### 4.1 组件分层

```
app/                    # Next.js App Router 页面
  layout.tsx            # 根布局
  (main)/layout.tsx     # NavBar + Footer + force-dynamic
  [username]/           # 博客主页
  dashboard/deploy/     # 部署面板

components/
  ui/                   # 通用 UI：Button, Modal, Toast, Skeleton, EmptyState
  blog/                 # 博客域：BlogHeader, BlogPostCard, CommentSection...
  editor/               # 编辑器：MarkdownEditor (Milkdown)
  modals/               # 模态框：CreatePostModal, EditPostModal, EditProfileModal
  nav/                  # 导航：TabNav
  search/               # 搜索：SearchBar
  figma/                # Figma 组件：ImageWithFallback
  NavBar.tsx            # 顶层导航栏

lib/
  store.ts              # Zustand (activeTab, searchQuery)
```

### 4.2 状态管理

| 层级 | 方案 | 适用场景 |
|------|------|----------|
| 全局 | Zustand (`useAppStore`) | 首页 Tab 切换、搜索状态 |
| 页面级 | `useState` / `useEffect` | 各页面内部状态 |
| 服务端 | SSR props → Client Component | 文章列表、用户资料等初始数据 |

**评价**：
- ✅ 状态管理轻量，没有引入 Redux 等重量方案
- ⚠️ Zustand store 只存了 tab/search 状态，未充分利用

### 4.3 渲染策略

| 页面 | 策略 | 原因 |
|------|------|------|
| `/` (首页) | SSR + Client | 文章列表需要认证状态决定是否显示关注 Tab |
| `/templates` | Static | 纯静态数据 |
| `/templates/[id]` | SSG | generateStaticParams |
| `/login`, `/register` | Client | 表单交互密集 |
| `/messages` | Client | 实时轮询 |
| `/dashboard/deploy` | Client | 交互密集 |
| `/[username]` | SSR | 需要认证+公开双重逻辑 |

---

## 五、安全分析

### 5.1 已有安全措施

| 措施 | 实现 | 评价 |
|------|------|------|
| 密码哈希 | bcrypt | ✅ |
| SSRF 防护 | deployHookUrl 域名白名单（originally） | ⚠️ 已移除，现在用 Token 方式 |
| 限流 | 内存滑动窗口 | ✅ 适用于单进程 |
| CSRF | NextAuth 内置 | ✅ |
| XSS | React 默认转义 + DOMPurify (markdown) | ✅ |
| 蜜罐反垃圾 | Comment 隐藏字段 | ✅ |
| 输入校验 | zod / 自定义 validate | ✅ |

### 5.2 安全风险

| 风险 | 严重度 | 说明 |
|------|--------|------|
| **Vercel Token 明文存储** | 🔴 高 | `SiteDeployment.vercelToken` 是用户 Vercel Full Account Token，泄露后攻击者可完全控制用户 Vercel 账号 |
| **评论身份伪造** | 🟡 中 | Comment.authorName 是前端传入的字符串，可伪造他人身份发评论 |
| **Prisma 注入** | 🟢 低 | Prisma 使用参数化查询，天然防注入 |
| **JWT 无撤销** | 🟡 中 | 用户无法主动使其他设备 session 失效 |

### 5.3 建议

1. **vercelToken 加密存储**：用 `AES-256-GCM` 加密后存 DB，密钥放环境变量
2. **Comment 关联 User**：已登录用户评论存 `userId`，匿名用户才用 authorName
3. **Token 轮换**：支持用户重新生成 Token 使旧 Token 失效

---

## 六、性能分析

### 6.1 瓶颈点

| 位置 | 问题 | 影响 |
|------|------|------|
| 首页 SSR | 3 次 DB 查询（posts + following + profiles），无缓存 | TTFB 高 |
| 消息轮询 | 5s 间隔 `GET /api/messages?with=` | 浪费带宽，用户不看消息也在轮询 |
| 模板站 SSG | `output: "export"` 下每次发布需全量重建 | 文章多时构建慢 |
| 公开 API | Cache-Control 60s，限流 60req/min | 基本够用 |

### 6.2 建议

1. 首页加 `stale-while-revalidate` 缓存头，或用 ISR
2. 消息改用 SSE / WebSocket，不要在后台页面也轮询
3. 模板站增量构建（ISR 代替 `output: "export"`）

---

## 七、优点总结

1. **架构清晰**：Next.js App Router + Prisma + Tailwind，主流技术栈，新成员上手快
2. **模型设计合理**：Profile 分离、Follow/Like 复合唯一约束、Message 索引
3. **安全意识到位**：bcrypt、限流、蜜罐、SSRF 防护（原版）、zod 校验
4. **测试覆盖**：63 个单元测试（API + lib 层），TDD 开发习惯好
5. **移动端适配**：响应式 NavBar、消息页切换、滑动 Tab
6. **模板架构好**：公开 API → SSG 模板站，标准 Jamstack 模式

---

## 八、需改进的问题

| # | 问题 | 优先级 | 建议 |
|---|------|--------|------|
| 1 | vercelToken 明文存 DB | 🔴 高 | AES 加密，或改用 Vercel OAuth |
| 2 | 一键部署需要 GitHub 连接 | 🔴 高 | 已加提示，但流程仍需用户手动操作 |
| 3 | Comment 身份不绑定 User | 🟡 中 | 登录用户存 userId |
| 4 | RateLimit 表僵尸数据 | 🟡 中 | 删除表或改用 DB 限流 |
| 5 | middleware 路径匹配脆弱 | 🟡 中 | 改用正则或路由配置表 |
| 6 | 无 ISR/缓存策略 | 🟡 中 | 首页、文章页加 ISR |
| 7 | 消息轮询浪费带宽 | 🟢 低 | 切到当前 Tab 时轮询，离开时停止 |
| 8 | 无 GraphQL API | 🟢 低 | 模板站查询可用 GraphQL 减少请求量 |
| 9 | 错误信息硬编码中文 | 🟢 低 | 接入 i18n key |
| 10 | E2E 测试为空 | 🟢 低 | Playwright 已配置但无用例 |

---

## 九、技术债务清单

| 债务 | 量级 | 预计工时 |
|------|------|----------|
| Comment 模型重构（加 userId） | 小 | 2h |
| vercelToken 加密 | 中 | 4h |
| RateLimit 表清理 | 小 | 0.5h |
| middleware 路径匹配重构 | 小 | 1h |
| ISR 缓存引入 | 中 | 3h |
| E2E 测试补充 | 大 | 8h |
| 消息 WebSocket/SSE 升级 | 大 | 16h |
| 一键部署 OAuth 化 | 大 | 20h |

---

## 十、总结

BlogPlatform 是一个设计合理、实现扎实的 MVP 产品。核心的"写作→发布→同步到独立博客"闭环完整，安全防护意识强。前端移动端适配到位，代码风格统一。

当前的主要短板在**部署体验**（一键部署依赖手动 GitHub 授权）和**Token 安全**（明文存储），其余问题属于成熟度提升范畴，不影响产品可用性。

**建议优先级**：
1. Token 加密（安全）
2. 优化部署流程提示（已完成）
3. Comment 关联 User（数据一致性）
4. 引入 ISR 缓存（性能）

# V3 模板部署系统 — 设计文档

> 产出: office-hours 需求深挖
> 日期: 2026-05-17
> 楔子决策: 聚焦模板一键部署，私信和社区讨论推迟到 V4

---

## 1. 产品决策

### 为什么是模板部署而不是私信/社区

| 维度 | 模板部署 | 私信/社区 |
|------|---------|-----------|
| 价值类型 | 工具型（单边即可交付价值） | 平台型（需要双边网络效应） |
| 目标用户匹配 | 独立开发者要自己的独立博客 | 不直接服务于"部署独立站"需求 |
| 差异化 | Medium/简书做不到 | Medium/简书已经有 |
| 冷启动 | 1 个用户就能用 | 需要 N 个用户才有价值 |

### 产品定位

**一句话**：一个让独立开发者从"写文章"到"上线独立技术博客"的平台。写完文章 → 点一下 → 自己的 vercel.app 域名博客同步更新。

**不是**：又一个社交博客平台（那是 Medium 的事）。

---

## 2. 用户流程

```
=== 站长首次使用 ===
已有账号 → 进入 /templates 模板市场
  ↓
浏览 2-3 个博客模板（极简/作品集/经典带侧边栏）
  ↓
选择模板 → 看到部署说明（3 步指引）
  ↓
步骤 1：复制模板仓库（点击 GitHub "Use this template" 按钮）
步骤 2：在 Vercel 导入仓库并配置环境变量（BLOG_API_URL + USERNAME）
步骤 3：在 Vercel 创建 Deploy Hook，回到平台填入 hook URL
  ↓
平台保存 deploy hook URL → 部署关系建立
  ↓
首次部署完成 → 用户获得 https://xxx.vercel.app 独立博客


=== 站长日常写文章 ===
在平台写/编辑文章 → 发布
  ↓
平台自动 POST deploy hook → Vercel 重新构建
  ↓
几分钟后 → 独立博客自动更新，新文章上线


=== 同步规则 ===
触发条件：
- 发布新文章 → 触发同步
- 编辑已发布文章 → 触发同步
- 删除文章 → 触发同步
- 更新个人信息（名称/简介/头像）→ 触发同步
- 手动点击「立即同步」按钮 → 触发同步

不同步的情况：
- 草稿文章（未发布）不触发
- 取消发布文章 → 触发同步（从博客移除）
```

---

## 3. 技术架构

```
┌─────────────────────────────────────┐
│          blog-platform (平台)        │
│                                     │
│  /templates    模板浏览/选择          │
│  POST webhook  文章变更 → 触发构建    │
│  /api/public/* 公开数据 API          │
└──────────┬──────────────────────────┘
           │
           │ POST {deploy_hook_url}
           ▼
┌──────────────────────┐
│       Vercel          │
│  重新构建 → 部署       │
└──────┬───────────────┘
       │ build time
       │ GET /api/public/...
       ▼
┌──────────────────────┐
│   模板 (Next.js)      │
│   build: fetch 数据    │
│   output: 静态博客站   │
└──────────────────────┘
```

### 3.1 公开数据 API（供模板消费）

模板在构建时通过以下 API 拉取数据：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/public/profile/[username]` | 用户 Profile（名称/简介/头像/标签） |
| GET | `/api/public/posts/[username]` | 已发布文章列表（标题/摘要/日期/封面图/标签） |
| GET | `/api/public/posts/[username]/[postId]` | 单篇文章完整内容（Markdown 原文） |

这些 API **公开可访问**、**只读**、**带 IP 速率限制**（每 IP 每分钟 60 次，复用 `lib/rate-limit.ts`）、**带缓存头**（`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`）。

### 3.2 部署关系存储

新增 `SiteDeployment` 数据模型：

```prisma
model SiteDeployment {
  id             String    @id @default(cuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  templateId     String           // 使用的模板 slug
  deployHookUrl  String           // Vercel deploy hook URL
  siteUrl        String?          // 部署后的网站 URL (vercel.app)
  lastSyncAt     DateTime?        // 上次同步时间
  lastSyncStatus String    @default("none")  // none | success | failed | pending
  lastSyncError  String?          // 上次同步失败的错误信息
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([userId])  // 一个用户只能有一个部署
}
```

### 3.3 同步逻辑

```
文章/Profile 变更
  ↓
API route handler 执行完数据库操作
  ↓
调用 await triggerDeploy(userId)  (同步等待, 5s timeout)
  ↓
triggerDeploy 内部：
  ├── 查询该用户的 SiteDeployment
  ├── 如果不存在 → 直接返回（用户未部署）
  ├── 如果存在 → POST {deployHookUrl}
  │     ├── POST 成功 → 更新 lastSyncAt + lastSyncStatus="success" + 清空 lastSyncError
  │     └── POST 失败/超时 → 更新 lastSyncStatus="failed" + 记录错误信息
  └── 返回结果
```

实现方式：在 `lib/sync.ts` 中导出 `triggerDeploy(userId: string)` 函数。

```ts
// src/lib/sync.ts
export async function triggerDeploy(userId: string) {
  const deployment = await prisma.siteDeployment.findUnique({
    where: { userId },
  });
  if (!deployment) return;

  try {
    const res = await fetch(deployment.deployHookUrl, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Vercel responded ${res.status}`);

    await prisma.siteDeployment.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        lastSyncError: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.siteDeployment.update({
      where: { userId },
      data: {
        lastSyncStatus: "failed",
        lastSyncError: message,
      },
    });
  }
}
```

在以下 API route 中手动调用 `triggerDeploy()`：
- `POST /api/posts` — 发布文章后
- `PUT /api/posts/[id]` — 编辑文章后
- `DELETE /api/posts/[id]` — 删除文章后
- `PUT /api/profile` — 更新个人信息后

---

## 4. 数据模型变更

### 4.1 新增模型

```prisma
model SiteDeployment {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  templateId    String
  deployHookUrl String
  siteUrl       String?
  lastSyncAt    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([userId])
}
```

### 4.2 模板定义（非数据库，配置文件）

模板不存数据库，用静态配置文件 `src/lib/templates.ts`：

```ts
export interface Template {
  id: string;           // 唯一标识
  name: string;         // 模板名称
  description: string;  // 简述
  thumbnail: string;    // 预览图 URL
  demoUrl: string;      // 演示站 URL
  repoUrl: string;      // GitHub 模板仓库 URL
  tags: string[];       // 标签
  features: string[];   // 功能点
}
```

v3 初始提供 2-3 个模板。

---

## 5. API 设计

### 5.1 部署管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| PUT | `/api/deployment` | 创建/更新部署配置 | 需登录 |
| GET | `/api/deployment` | 获取当前用户的部署状态 | 需登录 |
| DELETE | `/api/deployment` | 取消部署（不删除 Vercel 项目） | 需登录 |
| POST | `/api/deployment/sync` | 手动触发同步 | 需登录 |

### 5.2 公开 API（新增）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/public/profile/[username]` | Profile 公开数据 | 公开 |
| GET | `/api/public/posts/[username]` | 已发布文章列表 | 公开 |
| GET | `/api/public/posts/[username]/[postId]` | 单篇文章内容（含 Markdown 原文） | 公开 |

### 5.3 PUT /api/deployment 请求体

```json
{
  "templateId": "minimal-blog",
  "deployHookUrl": "https://api.vercel.com/v1/integrations/deploy/...",
  "siteUrl": "https://my-blog.vercel.app"  // 可选
}
```

---

## 6. 模板规范

### 6.1 模板技术要求

每个模板是一个独立的 GitHub 仓库，使用 Next.js 构建：

- 静态生成（SSG），在构建时拉取数据
- 通过环境变量 `NEXT_PUBLIC_BLOG_API_URL` 获取平台 API 地址
- 通过环境变量 `NEXT_PUBLIC_USERNAME` 确定博客所有者
- 支持 RSS Feed
- 响应式设计，移动端友好

### 6.2 V3 提供的模板

| 模板 | 风格 | 适用场景 |
|------|------|---------|
| `minimal-blog` | 极简白底黑字，专注于阅读 | 技术博客/写作 |
| `portfolio` | 带项目展示区的作品集风格 | 独立开发者/设计师 |

### 6.3 模板文件结构

```
minimal-blog/
├── app/
│   ├── layout.tsx          # HTML head, fonts, metadata
│   ├── page.tsx            # 首页：头像+简介+文章列表
│   ├── [slug]/
│   │   └── page.tsx        # 文章页：标题+正文+日期
│   └── rss.xml/
│       └── route.ts        # RSS Feed
├── lib/
│   ├── api.ts              # fetch 封装，从平台 API 拉数据
│   └── types.ts            # Profile, Post 类型
├── .env.example            # NEXT_PUBLIC_BLOG_API_URL + NEXT_PUBLIC_USERNAME
├── next.config.ts
└── package.json
```

### 6.4 模板 api.ts 参考实现

```ts
const API_URL = process.env.NEXT_PUBLIC_BLOG_API_URL || "";
const USERNAME = process.env.NEXT_PUBLIC_USERNAME || "";

export async function getProfile(): Promise<Profile | null> {
  const res = await fetch(`${API_URL}/api/public/profile/${USERNAME}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${API_URL}/api/public/posts/${USERNAME}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getPost(slug: string): Promise<Post | null> {
  const res = await fetch(`${API_URL}/api/public/posts/${USERNAME}/${slug}`);
  if (!res.ok) return null;
  return res.json();
}
```

---

## 7. 页面 & 交互设计

### 7.1 新增页面

| 页面 | 路由 | 说明 |
|------|------|------|
| 模板市场 | `/templates` | 浏览所有可用模板，预览图 + 功能列表 |
| 模板详情 | `/templates/[id]` | 大图预览 + 演示链接 + 部署引导 |
| 部署管理 | `/dashboard/deploy` | 查看当前部署状态、手动同步 |

### 7.2 部署引导流程（step-by-step）

在模板详情页，用户点击"使用此模板"后，弹出/展示分步引导：

```
步骤 1 ── 注册 Vercel（如果还没有）
步骤 2 ── Fork 模板仓库（一键跳转 GitHub）
步骤 3 ── 在 Vercel 中 Import 该仓库
         配置环境变量：
           NEXT_PUBLIC_BLOG_API_URL = {平台 URL}
           NEXT_PUBLIC_USERNAME = {当前用户名}
步骤 4 ── 部署后，在 Vercel 项目设置中创建 Deploy Hook
         复制 hook URL
步骤 5 ── 回到此页面，粘贴 Deploy Hook URL
         点击「完成设置」
```

### 7.3 部署状态面板

部署完成后，在 `/dashboard/deploy` 显示：

- 当前使用的模板名称
- 网站 URL（可点击访问）
- 上次同步时间
- **同步状态**：成功（绿色）/ 失败（红色 + 错误信息 + 重试按钮）/ 无记录（灰色）
- 「手动同步」按钮
- 「更改模板」按钮
- 「取消部署」按钮

### 7.4 NavBar 变更

在 NavBar 中增加：
- 「模板市场」链接（`/templates`）
- 如果用户已部署：博客 URL 链接（外链）

---

## 8. 测试策略

### 8.1 关键路径测试（3 个测试文件）

| 测试文件 | 测试内容 |
|---------|---------|
| `src/__tests__/api/public.test.ts` | 公开 API 返回正确 JSON、published=false 的文章不可见、缓存头存在、不存在的用户名返回 404 |
| `src/__tests__/lib/sync.test.ts` | triggerDeploy 正确 POST deploy hook、没有部署时直接返回、POST 失败时更新 status=failed、超时处理 |
| `src/__tests__/api/deployment.test.ts` | PUT 创建/更新部署、GET 读取部署状态、DELETE 取消部署、POST sync 手动触发、未登录返回 401 |

### 8.2 测试工具

- `vitest`（项目已有，复用 `vitest.config.ts`）
- `fetch` mock（使用 vitest 的 `vi.fn()` 模拟 Deploy Hook POST）

---

## 9. 模板更新机制

- **V3**：模板 repo README 写明手动更新指引（`git pull upstream` 同步模板修复，然后 Vercel 自动重新部署）
- **V4**：平台内提供「同步模板更新」按钮，自动 pull 上游、提交、推送触发 Vercel 重新构建

---

## 10. 开发路线

### 阶段 1：公开 API + 核心逻辑（预计 0.5 天）

1. 新增 `SiteDeployment` 数据模型（含 `lastSyncStatus` / `lastSyncError`），`prisma db push`
2. 实现 `GET /api/public/profile/[username]` + IP 速率限制
3. 实现 `GET /api/public/posts/[username]` + IP 速率限制
4. 实现 `GET /api/public/posts/[username]/[postId]` + IP 速率限制
5. 实现 `lib/sync.ts` — `triggerDeploy()` 核心函数（同步 await + 状态记录）

**验证**：公开 API 返回正确 JSON + 缓存头。`triggerDeploy()` mock 验证。

### 阶段 2：部署管理 API + 集成（预计 0.5 天）

6. 实现 `PUT /api/deployment` — 创建/更新部署
7. 实现 `GET /api/deployment` — 读取部署状态（含 syncStatus/syncError）
8. 实现 `DELETE /api/deployment` — 取消部署
9. 实现 `POST /api/deployment/sync` — 手动同步
10. 文章 CRUD API（POST/PUT/DELETE）中集成 `triggerDeploy()`
11. Profile UPDATE API 中集成 `triggerDeploy()`

**验证**：发布文章 → Vercel 收到 deploy hook POST → 博客更新。`/dashboard/deploy` 显示同步状态。

### 阶段 3：模板页面（预计 1 天）

12. 创建 `src/lib/templates.ts` 模板配置
13. 实现 `/templates` 页面（模板市场列表）
14. 实现 `/templates/[id]` 页面（详情 + 部署引导）
15. 实现 `/dashboard/deploy` 页面（部署状态面板 + 同步状态指示）
16. NavBar 增加入口链接

**验证**：用户能浏览模板、查看详情、跟随指引完成部署。

### 阶段 4：首个模板开发 + 测试（预计 2 天）

17. 创建 `minimal-blog` 模板 GitHub 仓库
18. 实现模板的 Next.js 项目（首页 + 文章页 + RSS）
19. 实现模板的 `lib/api.ts`
20. 测试：连接平台 → 部署到 Vercel → 验证文章同步
21. 创建 `portfolio` 模板（简化版，复用 minimal-blog 架构）
22. 更新 `templates.ts` 配置指向实际仓库
23. 写 3 个测试文件（公开 API / triggerDeploy / 部署 API）

**验证**：用户使用 minimal-blog 模板部署后，访问独立博客能看到全部已发布文章。测试全部通过。

### 阶段 5：收尾（预计 0.5 天）

24. 写同步状态提示（成功/失败/进行中的 UI 反馈）
25. 部署相关的错误处理（deploy hook 超时、网络错误、无效 URL）
26. 部署上线到 Vercel（配置生产环境 URL 供模板使用）
27. 更新 README 和 CHANGELOG

**总预估：4.5 天（含测试）**

---

## 11. 后续迭代（V4+）

| 功能 | 优先级 | 触发条件 |
|------|--------|---------|
| **模板自动更新** | 高 | 模板有 bug 修复时用户需要手动同步 |
| **Vercel OAuth 一键部署** | 高 | 手动流程用户流失率高 |
| **自定义域名** | 中 | 用户反馈需要 |
| **更多模板**（3-5 个） | 中 | 基础模板验证可行 |
| **模板自定义**（颜色/字体） | 低 | 模板数量不够时补充 |
| **私信系统** | 待验证 | 部署用户活跃后评估 |
| **社区讨论** | 待验证 | 平台 DAU > 100 后评估 |
| **文章统计**（阅读量/PV） | 低 | 嵌入模板的 analytics |

---

## 12. 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 部署方式 | Deploy Hook（非 OAuth） | v3 MVP 避免 OAuth 复杂度，后续迭代再加 |
| 模板构建方式 | SSG (build-time fetch) | SEO 友好，对技术博客至关重要 |
| 模板数据源 | 平台公开 API（非嵌入代码） | 解耦模板和平台，模板独立维护 |
| 同步触发 | 同步 await triggerDeploy() + 状态记录 | 用户可见同步结果，部署用户极少不影响性能 |
| 同步集中管理 | `lib/sync.ts` 导出函数，route 内手动调用 | 逻辑集中，调用点明确，无额外抽象层 |
| 公开 API 防护 | IP 速率限制（60次/分钟）+ 缓存头 | 复用已有 rate-limit 机制，零新增依赖 |
| 同步失败处理 | lastSyncStatus + lastSyncError 字段 | 用户可在面板看到失败状态并重试 |
| 模板存储 | GitHub 独立仓库 | 模板可被 fork，用户完全拥有代码 |
| 部署限制 | 一个用户一个部署 | v3 简化，后续可支持多站点 |
| 缓存策略 | `s-maxage=60, stale-while-revalidate=300` | 模板构建时数据不过于陈旧，API 压力可控 |
| 测试策略 | 3 个关键路径测试文件 | 覆盖公开API/triggerDeploy/部署API |
| 模板更新 | V3 手动指引，V4 自动同步 | V3 用户量少，手动够用 |

---

## 13. Review 记录

| 审查 | 日期 | 决策数 | 关键变更 |
|------|------|--------|---------|
| Office Hours | 2026-05-17 | 5 | 确定楔子：模板部署；搁置私信和社区 |
| CEO Review | 2026-05-17 | 5 | 增加同步状态/API 防护/集中触发/构建容错/模板更新策略 |
| Eng Review | 2026-05-17 | 3 | 确定 sync.ts 实现方案/测试策略/sync-vs-async |

---

## 附：模板仓库位置（规划）

```
https://github.com/{org}/blog-template-minimal
https://github.com/{org}/blog-template-portfolio
```

模板仓库 README 包含：
- 模板截图
- 部署指南（连接 blog-platform 的步骤）
- 环境变量说明
- 自定义指南（如何修改样式）

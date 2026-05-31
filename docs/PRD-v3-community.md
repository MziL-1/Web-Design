# BlogPlatform v3 — 社区功能 PRD

> 版本: v3.0.0-draft  
> 日期: 2026-05-24  
> 状态: 设计中

---

## 一、功能清单（按优先级排序）

### P0 — 可独立交付、无外部依赖

| # | 功能 | 预估 | 描述 |
|---|------|------|------|
| P0-1 | 通知中心 | 4h | 聚合通知面板（关注、回复、社区公告），顶部铃铛红点。支持列表展示 + 一键全部已读 |
| P0-2 | 私信增强 — Emoji 面板 | 2h | 私信输入框旁加 Emoji 按钮，弹出 emoji 面板，选中后追加到输入框 |
| P0-3 | 私信增强 — 图片发送 | 2h | 私信输入框旁加图片按钮，选择图片后上传到 Vercel Blob，以缩略图形式渲染在聊天中 |

### P1 — 需要 Supabase 基础设施

| # | 功能 | 预估 | 描述 |
|---|------|------|------|
| P1-1 | Supabase 接入 + 社区数据模型 | 3h | 创建 Supabase 项目，建表（community / member / message / resource / announcement）。迁移通知模型到 Turso |
| P1-2 | 社区发现页 | 4h | 首页新增「社区」Tab。社区列表（卡片网格 + 搜索），创建社区表单 |
| P1-3 | 社区加入/退出 API | 2h | 加入/退出社区 + 成员计数维护 |

### P2 — 社区核心体验

| # | 功能 | 预估 | 描述 |
|---|------|------|------|
| P2-1 | 地图画布组件 | 8h | 无限画布（拖拽 + 缩放），模块占位渲染，缩略图导航，缩放工具栏 |
| P2-2 | 社区介绍模块 | 2h | 社区名称、描述、封面图、标签展示 |
| P2-3 | 成员列表模块 | 2h | 成员头像网格 + 列表，角色标识（owner/admin/member），成员计数 |

### P3 — 实时通信

| # | 功能 | 预估 | 描述 |
|---|------|------|------|
| P3-1 | 实时群聊（Supabase Realtime） | 8h | WebSocket 推送，消息持久化，在线人数，滚动加载历史消息 |
| P3-2 | 聊天中分享博客卡片 | 2h | 在聊天中发送平台博客链接，自动渲染为卡片（标题 + 封面 + 摘要） |

### P4 — 丰富模块

| # | 功能 | 预估 | 描述 |
|---|------|------|------|
| P4-1 | 共享资源模块 | 4h | 添加链接/文件，列表展示，按类型筛选 |
| P4-2 | 活动公告模块 | 3h | 管理员发布公告/活动，置顶功能 |
| P4-3 | 画布模板系统 | 6h | 社区创建时选模板（3~5套视觉主题 + 默认模块布局），创建后可微调模块位置 |

---

## 二、用户故事

### 模块 A：通知中心

| ID | 故事 |
|----|------|
| US-A1 | As a 平台用户, I want 在导航栏看到未读通知数, So that 我能第一时间感知到有人关注我或我的社区有新动态 |
| US-A2 | As a 平台用户, I want 在点击铃铛后看到按时间排列的通知列表, So that 我能逐条查看和跳转到对应内容 |
| US-A3 | As a 平台用户, I want 一键标记所有通知为已读, So that 我不需要逐条点击就能清掉红点 |

### 模块 B：私信增强

| ID | 故事 |
|----|------|
| US-B1 | As a 聊天用户, I want 在输入框旁点 Emoji 按钮选择表情, So that 我发送的消息更生动 |
| US-B2 | As a 聊天用户, I want 聊天框里发送图片并看到缩略图预览, So that 我能和对方分享截图/照片 |

### 模块 C：社区系统

| ID | 故事 |
|----|------|
| US-C1 | As a 平台用户, I want 在首页看到「社区」Tab 并浏览/搜索社区, So that 我能发现感兴趣的组织并加入 |
| US-C2 | As a 平台用户, I want 创建自己的社区（填写名称/描述/选模板）, So that 我能围绕某个主题建立自己的圈子 |
| US-C3 | As a 社区成员, I want 进入社区后看到一张地图一样的界面, So that 我能直观地找到聊天广场、资源、公告等功能区 |
| US-C4 | As a 社区成员, I want 在聊天广场实时收发消息, So that 我能和社区其他成员即时交流 |
| US-C5 | As a 社区成员, I want 在聊天中分享一篇平台上的博客文章并以卡片形式展示, So that 我能快速推荐优质内容 |
| US-C6 | As a 社区成员, I want 看到社区成员列表和贡献排行, So that 我能了解社区的核心成员 |
| US-C7 | As a 社区管理员, I want 发布/置顶公告和活动, So that 我能及时通知社区成员重要事项 |

### 模块 D：共享资源

| ID | 故事 |
|----|------|
| US-D1 | As a 社区成员, I want 添加有用的链接或文件到共享资源区, So that 社区的知识积累不会散落在聊天记录里 |
| US-D2 | As a 社区成员, I want 按类型筛选资源（链接/文件）, So that 我能快速找到需要的内容 |

---

## 三、验收标准（每个功能 Done 的定义）

### P0-1：通知中心

- [ ] 系统事件（关注、回复）发生后自动生成通知记录
- [ ] 导航栏铃铛显示未读数量红点（>99 显示 99+）
- [ ] 点击铃铛弹出通知下拉面板，按时间倒序排列
- [ ] 每条通知显示标题/正文/时间/已读状态，点击可跳转
- [ ] 「全部已读」按钮清空所有红点
- [ ] 通知不挤压数据库：单用户展示最近 50 条，旧数据归档

### P0-2：Emoji 面板

- [ ] 聊天输入框右侧出现 😊 按钮
- [ ] 点击弹出 emoji 选择面板（emoji-picker-react）
- [ ] 选中 emoji 追加到输入框光标位置，不覆盖已有文字
- [ ] 发送后 emoji 正确渲染（浏览器原生 emoji 字体）
- [ ] 面板在点击外部时关闭
- [ ] 移动端面板自适应屏幕宽度

### P0-3：图片发送

- [ ] 聊天输入框右侧出现 🖼 按钮
- [ ] 点击触发文件选择器（accept="image/*"）
- [ ] 选择图片后上传到 Vercel Blob（复用 /api/upload）
- [ ] 上传期间显示进度指示（至少 loading 状态）
- [ ] 上传成功后自动发送消息（type=image, metadata={url,w,h}）
- [ ] 图片消息在聊天中渲染为可点击预览的缩略图（max-w=200px）
- [ ] 点击缩略图在新标签打开原图
- [ ] 单张图片 ≤5MB，临时 URL 有效期内可访问

### P1-1：Supabase 基础设施

- [ ] Supabase 项目创建完成，获取 URL + anon key
- [ ] community / community_member / community_message / community_resource / community_announcement 五张表创建完毕
- [ ] community_message 加入 supabase_realtime publication
- [ ] Turso 侧 Notification 表创建完毕
- [ ] 环境变量 SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY 配置到 Vercel
- [ ] supabase-js 客户端单例初始化（src/lib/supabase.ts）

### P1-2：社区发现页

- [ ] 首页 Tab 栏新增「社区」（排在「发现博客」「我的关注」后面）
- [ ] 社区列表以卡片网格展示（2 列 md 以上，1 列移动端）
- [ ] 每张卡片显示：封面图、名称、简介、成员数、标签
- [ ] 支持搜索（按名称/简介模糊匹配）
- [ ] 已加入的社区显示「已加入」标记并排在最前
- [ ] 「创建社区」按钮 → 弹出创建表单（名称、slug、描述、选模板）
- [ ] 创建成功后自动加入社区并跳转到社区地图页

### P1-3：加入/退出

- [ ] 社区卡片上「加入」按钮，已加入显示「已加入」
- [ ] 加入后 member_count +1，退出后 -1
- [ ] 退出时二次确认
- [ ] 社区创建者自动成为 owner 角色，不可退出自己的社区（只能删除）

### P2-1：地图画布

- [ ] 画布支持鼠标拖拽移动（pointer events）
- [ ] 画布支持滚轮缩放（0.3x ~ 3x），以鼠标位置为锚点
- [ ] 右下角显示缩略图导航（MiniMap，200x150px）
- [ ] 顶部工具栏：放大/缩小按钮、回到默认视角按钮
- [ ] 缩放/位置状态暂存于 URL query params（分享链接能还原视角）
- [ ] 接入 Sentry/console 错误日志

### P2-2：社区介绍模块

- [ ] 画布上一个固定模块显示社区名称、描述、封面图
- [ ] 社区管理员可编辑（通过模块上的编辑按钮跳转设置页）
- [ ] 非管理员只读

### P2-3：成员列表模块

- [ ] 展示成员总数
- [ ] 前 20 位成员头像网格，点击展开完整列表
- [ ] 成员旁显示角色标签（群主/管理员）
- [ ] 支持搜索成员

### P3-1：实时群聊

- [ ] 社区消息通过 Supabase Realtime channel 实时推送到所有在线成员
- [ ] 消息发送后 500ms 内到达其他在线用户
- [ ] 消息持久化存储，刷新后历史消息不丢失
- [ ] 默认加载最近 50 条消息，向上滚动加载更多（分页）
- [ ] 消息格式支持：纯文本、图片、博客卡片
- [ ] 新消息到达时，若用户在底部 120px 内，自动滚到底部
- [ ] 离开社区页面时自动 unsubscribe channel
- [ ] 群聊消息不触发通知中心的逐条通知（只有 @提及才通知）

### P3-2：博客卡片分享

- [ ] 聊天输入框旁「分享文章」按钮
- [ ] 点击弹出文章选择器（列出自己的已发布文章）
- [ ] 选中后以卡片形式发送（标题 + 封面缩略图 + 160 字摘要 + 链接）
- [ ] 接收方点击卡片跳转到文章详情页

### P4-1：共享资源

- [ ] 模块内按时间倒序列出所有资源
- [ ] 添加资源表单（标题 + URL 或文件上传）
- [ ] 支持按类型筛选（全部 / 链接 / 文件）
- [ ] 每条资源显示添加者头像和添加时间

### P4-2：活动公告

- [ ] 模块内按置顶优先 + 时间倒序排列
- [ ] 管理员可发布公告（标题 + 正文，支持 Markdown）
- [ ] 管理员可置顶/取消置顶/删除
- [ ] 新公告推送通知给所有社区成员

### P4-3：模板系统

- [ ] 预置 3~5 套画布模板（不同背景图 + 默认模块位置）
- [ ] 创建社区时选模板，可在预览中看到效果
- [ ] 社区管理员可拖动模块到画布任意位置，位置自动保存
- [ ] 迁移工具支持新字段 `map_layout` JSONB

---

## 四、版本规划

### MVP (v3.0) — 2 周
```
P0-1  通知中心
P0-2  私信 Emoji
P0-3  私信图片
P1-1  Supabase 基础设施
P1-2  社区发现页 + 创建
P1-3  社区加入/退出
```

**交付物**: 用户可以浏览/创建社区，私信支持图文，导航栏有通知红点。

### V1 (v3.1) — +1 周
```
P2-1  地图画布组件
P2-2  社区介绍模块
P2-3  成员列表模块
P3-1  实时群聊
P3-2  博客卡片分享
```

**交付物**: 社区有完整的「地图」交互体验，成员可以实时聊天、分享文章。

### V2 (v3.2) — +1 周
```
P4-1  共享资源模块
P4-2  活动公告模块
P4-3  画布模板系统
```

**交付物**: 社区功能齐全，创建者可以自定义布局，积累知识库和活动历史。

---

## 五、非功能需求

### 性能

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 群聊消息延迟（发送到广播） | < 500ms | Supabase Realtime dashboard |
| 画布首屏渲染（缩放 1x） | < 300ms | Lighthouse / React Profiler |
| 通知列表加载（50条） | < 200ms | 数据库查询日志 |
| 图片上传（1MB） | < 3s | 前端计时 |
| 社区列表首屏加载 | < 1s | Lighthouse TTI |
| 地图交互（拖拽/缩放） | 60fps | Chrome DevTools FPS meter |

### 安全

| 要求 | 实现 |
|------|------|
| 群聊消息发送者不可伪造 | API 层从 session 读取 userId，不接受前端传入 |
| 社区操作权限校验 | owner/admin/member 三级角色，API 层校验 |
| 图片上传内容校验 | 服务端校验 MIME type + 文件大小 + 病毒扫描（可选） |
| XSS 防护 | 聊天消息渲染时转义 HTML，不使用 dangerouslySetInnerHTML |
| Supabase anon key 安全性 | Row Level Security 规则限制数据访问范围 |
| 限流 | 群聊消息 10条/10s/用户，创建社区 3次/h/用户 |

Supabase Row Level Security 规则示例:

```sql
-- 只允许社区成员读取该社区的消息
CREATE POLICY "community_messages_read" ON community_message
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM community_member
    WHERE community_id = community_message.community_id
    AND user_id = auth.uid()
  )
);

-- 只允许社区成员插入消息
CREATE POLICY "community_messages_insert" ON community_message
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_member
    WHERE community_id = community_message.community_id
    AND user_id = auth.uid()
  )
);
```

### 兼容性

| 方面 | 要求 |
|------|------|
| 浏览器 | Chrome/Firefox/Safari/Edge 近 2 个主版本 |
| 移动端 | iOS Safari 15+, Android Chrome 100+ (画布支持双指缩放) |
| 屏幕 | 320px ~ 2560px 响应式，画布在移动端降低默认缩放比例 |
| 辅助功能 | 画布提供键盘导航（方向键移动，+/- 缩放），模块可 Tab 切换 |
| 降级 | 不支持 Pointer Events 的旧浏览器显示静态布局替代画布 |

### 数据

| 要求 | 说明 |
|------|------|
| 消息保留 | 群聊消息永久保留，支持向上滚动加载历史 |
| 通知清理 | 超过 90 天的通知自动删除（定时任务或 DB 触发器） |
| 图片存储 | Vercel Blob 自动过期或按量清理，单用户总容量 ≤100MB |
| 软删除 | 社区删除为软删除（标记 deleted_at），7 天内可恢复 |

### 监控

| 指标 | 工具 |
|------|------|
| Supabase Realtime 连接数 + 消息吞吐 | Supabase Dashboard |
| API 错误率 + P99 延迟 | Vercel Analytics / Sentry |
| 前端 JS 异常 | Sentry |
| 数据库慢查询 | Turso Dashboard + Supabase Query Performance |

---

## 六、附录

### A. 现有架构约束

| 约束 | 影响 |
|------|------|
| Vercel 无 WebSocket | 群聊用 Supabase Realtime，不走 Vercel |
| Turso 无 pub/sub | 通知走 Turso (无实时推送, 用户刷新/轮询获取) |
| Vercel Blob 按量计费 | 图片上传需限流 + 容量上限 |
| Vercel Hobby 计划限制 | 单次函数执行 ≤10s, 大文件上传需前端直传 Blob Store |

### B. 技术依赖新增

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "@supabase/realtime-js": "^2.x",
    "emoji-picker-react": "^4.x"
  }
}
```

### C. 环境变量新增

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

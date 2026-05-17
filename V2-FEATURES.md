# V2 版本功能总结

## 一、已完成功能（24 项）

### 核心功能
| 功能 | 描述 |
|------|------|
| **标签系统** | Post/Profile 多对多标签，TagBadge 组件，标签选择器，自定义标签 |
| **关注系统** | Follow/Unfollow API，FollowButton 组件，关注/粉丝列表 |
| **点赞系统** | Like/Unlike API，LikeButton 组件，实时计数 |
| **搜索系统** | `/api/search` 全站搜索（用户+文章+标签），NavBar 实时下拉 autocomplete（300ms debounce），Enter 键跳转搜索结果页 |
| **评论系统** | 文章评论 CRUD，CommentSection 组件，SSR initial + 客户端提交 |
| **WYSIWYG 编辑器** | Milkdown（ProseMirror）编辑器，commonmark + gfm + history 预设，Markdown 实时序列化（getMarkdown） |
| **文件导入** | 拖拽/点击上传 .md / .docx 文件，mammoth 解析 Word，自动填入标题+内容 |
| **图片粘贴** | 编辑器内 Ctrl+V 粘贴图片 → 自动上传 → 插入 ProseMirror image node 即时渲染 |
| **封面图** | 上传封面图 / 自动提取正文第一张 `![]()` 作为封面，BlogPostCard 右侧等比展示，悬停 1.1x 放大 |
| **文章图片放大** | 点击正文图片弹出 ImageLightbox（ESC / 点击遮罩 / X 按钮关闭，body scroll lock） |

### 页面 & 路由
| 页面 | 功能 |
|------|------|
| **首页 / 发现博客** | 全部公开文章流（作者+头像+日期+标题+摘要+点赞数+评论数+标签），分页（5/10/20/50），已关注博主文章显示「我的关注」徽章 |
| **首页 / 我的关注** | 已关注博主卡片（头像+名称+简介+标签+文章数），分页 |
| **博客页 /[username]** | 居中布局，Cormorant Garamond display 字体，博主头像+介绍+标签+关注/私信按钮，文章列表含封面图 |
| **文章页 /[username]/[postId]** | 42px display font 标题，作者元数据行，点赞+收藏按钮，评论发布，文内图片点击放大 |
| **消息页 /messages** | Figma 设计还原，左侧聊天列表（未读红点 badge），右侧对话面板，AnimatePresence 消息气泡动画，支持 `?to=username` 自动开启对话 |
| **登录 / 注册** | NextAuth credentials 认证，表单验证，注册成功提示 |

### 弹窗系统（统一 spring 物理动画）
| 弹窗 | 功能 |
|------|------|
| **CreatePostModal** | 标题输入 + MarkdownEditor + FileImportDropzone + 封面图上传 |
| **EditPostModal** | 编辑标题/内容/封面图/发布状态 |
| **EditProfileModal** | 头像上传 + 显示名称 + 个人简介 + 标签选择（预设+自定义） |
| **ProfileDetailModal** | 查看博主详情（头像/名称/简介/标签/统计数据） |

### UI/UX
- **设计系统**：Cormorant Garamond display + Inter body，gray-950/600/400 色板，#FAFAFA 背景
- **Footer**：三栏网格页脚（品牌/分类/链接）+ 版权
- **NavBar**：黑底写文章按钮，搜索框实时 autocomplete 下拉，铃铛→消息，头像→博客，退出按钮
- **Modal 动画**：`transform-origin: top left` + spring `cubic-bezier(0.34, 1.56, 0.64, 1)` 弹入，左上角先到位
- **Tab 切换动画**：单滑动指示器 `transition-all duration-300 ease-in-out`
- **滚动条稳定**：`scrollbar-gutter: stable` 防止页面抖动
- **性能优化**：动态 import（Milkdown / react-markdown / CommentSection / MarkdownEditor），`optimizePackageImports`，staleTimes 缓存

### 工程
- 23 单元测试（validation / tags / import），TypeScript 零错误，生产构建通过
- Prisma SQLite + 8 个数据模型（User / Profile / Post / Comment / Tag / Follow / Like / RateLimit）
- 30 个 API 路由，middleware 统一鉴权
- Vercel Blob Storage / 本地文件系统双模式图片存储

---

## 二、可深入开发的模块

| 模块 | 现状 | 深入方向 |
|------|------|---------|
| **消息系统** | 纯前端 mock 数据，无后端 | WebSocket 实时通讯，消息持久化到 DB，在线状态、已读回执、输入中提示 |
| **搜索** | 仅标题/用户名/标签名 contains 查询 | SQLite FTS5 或 Elasticsearch 全文搜索，搜索结果高亮、搜索历史 |
| **编辑器** | Milkdown 基础 commonmark+gfm | 工具栏 UI（加粗/斜体/链接面板），图片拖拽排序，协作编辑（Yjs） |
| **权限** | 仅 owner 判断 + 登录态 | RBAC 角色系统（admin/editor/viewer），文章可见性（公开/关注可见/私密） |
| **通知** | 无 | 评论通知、关注通知、点赞通知，站内信 + 邮件通知 |
| **数据统计** | 无 | 文章阅读量、点赞趋势、博主仪表盘（访问来源/设备/地域） |
| **SEO** | 基础 metadata + RSS | sitemap.xml，结构化数据（JSON-LD），OG / Twitter Card 完善 |

---

## 三、建议添加的功能

1. **文章目录（TOC）**：侧边栏自动解析 `##` 标题生成可点击目录锚点
2. **阅读进度条**：页面顶部固定进度条，随滚动进度变化
3. **暗色模式**：CSS 变量 + Tailwind `dark:` 类 + 系统跟随
4. **草稿自动保存**：localStorage 定时保存编辑器内容，防止意外关闭丢失
5. **文章系列/合集**：将多篇相关文章组织成系列，提供前后导航
6. **Markdown 导出**：一键下载 .md 文件
7. **社交分享**：一键分享到微博/Twitter，生成 OG Image 分享卡片
8. **代码语法高亮**：Shiki 或 Prism 对代码块进行语法着色

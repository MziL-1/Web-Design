export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  demoUrl: string;
  repoUrl: string;
  repoFullName: string;
  repoBranch: string;
  tags: string[];
  features: string[];
}

export const TEMPLATES: Template[] = [
  {
    id: "minimal-blog",
    name: "极简技术博客",
    description: "白底黑字，极简排版，专注阅读体验。适合技术博客和写作。",
    thumbnail: "/templates/minimal-blog.png",
    demoUrl: "https://blog.ourblog-platform.cn",
    repoUrl: "https://github.com/MziL-1/blog-template-minimal",
    repoFullName: "MziL-1/blog-template-minimal",
    repoBranch: "main",
    tags: ["博客", "极简", "技术"],
    features: [
      "SSG 静态生成，SEO 友好",
      "RSS Feed 自动生成",
      "响应式设计，移动端适配",
      "Cormorant Garamond + Inter 字体",
    ],
  },
  {
    id: "portfolio",
    name: "开发者作品集",
    description: "带项目展示区的作品集风格模板，展示你的项目和文章。",
    thumbnail: "/templates/portfolio.png",
    demoUrl: "https://portfolio-demo.vercel.app",
    repoUrl: "https://github.com/MziL-1/blog-template-portfolio",
    repoFullName: "MziL-1/blog-template-portfolio",
    repoBranch: "main",
    tags: ["作品集", "项目展示"],
    features: [
      "项目卡片展示区",
      "文章列表 + 详情页",
      "响应式设计",
      "SSG 静态生成",
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

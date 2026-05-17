import Link from "next/link";
import type { Metadata } from "next";
import { TEMPLATES } from "@/lib/templates";

export const metadata: Metadata = {
  title: "模板市场 — 选择你的博客模板",
  description: "浏览精美的博客模板，一键部署到 Vercel",
};

export default function TemplatesPage() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-semibold text-zinc-900 mb-3">
          模板市场
        </h1>
        <p className="text-zinc-500 text-base">
          选择一个模板，一键部署属于你自己的独立博客
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {TEMPLATES.map((template) => (
          <Link
            key={template.id}
            href={`/templates/${template.id}`}
            className="group block bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-400 hover:shadow-md transition-all"
          >
            <div className="aspect-video bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm">
              {template.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>预览图</span>
              )}
            </div>
            <div className="p-5">
              <h2 className="font-display text-xl font-semibold text-zinc-900 mb-2 group-hover:text-zinc-700 transition-colors">
                {template.name}
              </h2>
              <p className="text-zinc-500 text-sm mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTemplate, TEMPLATES } from "@/lib/templates";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const template = getTemplate(id);
  if (!template) return { title: "模板不存在" };
  return {
    title: `${template.name} — 模板详情`,
    description: template.description,
  };
}

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params;
  const template = getTemplate(id);

  if (!template) notFound();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Link
        href="/templates"
        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6 inline-block"
      >
        &larr; 返回模板市场
      </Link>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden mb-10">
        <div className="aspect-video bg-zinc-100 flex items-center justify-center text-zinc-400">
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
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-900 mb-3">
        {template.name}
      </h1>
      <p className="text-zinc-500 text-base mb-6">{template.description}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {template.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-zinc-100 text-zinc-600 text-sm rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 mb-10">
        <h2 className="font-display text-lg font-semibold text-zinc-900 mb-3">
          功能特性
        </h2>
        <ul className="space-y-2">
          {template.features.map((feature) => (
            <li key={feature} className="text-sm text-zinc-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-10">
        <h2 className="font-display text-lg font-semibold text-zinc-900 mb-4">
          部署指南
        </h2>
        <ol className="space-y-4 text-sm text-zinc-600">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
            <div>
              <strong className="text-zinc-900">注册 Vercel + 连接 GitHub</strong>
              <p className="mt-1">
                前往{" "}
                <a href="https://vercel.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  vercel.com
                </a>{" "}
                用 GitHub 注册登录，然后去{" "}
                <a href="https://vercel.com/dashboard/settings/integrations" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Settings → Integrations → GitHub
                </a>{" "}
                完成授权连接。
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
            <div>
              <strong className="text-zinc-900">创建 Vercel Token</strong>
              <p className="mt-1">
                前往{" "}
                <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  vercel.com/account/tokens
                </a>{" "}
                创建 Token，选择 <strong>Full Account</strong> 权限。
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
            <div>
              <strong className="text-zinc-900">回到平台一键部署</strong>
              <p className="mt-1">
                前往{" "}
                <Link href="/dashboard/deploy" className="text-blue-600 hover:underline">
                  部署管理
                </Link>{" "}
                页面，选择模板，粘贴 Token，点击「开始部署」。平台自动创建项目、配置环境变量。
              </p>
            </div>
          </li>
        </ol>
      </div>

      <div className="flex gap-4 flex-wrap">
        <a
          href={template.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors"
        >
          查看模板仓库
        </a>
        <a
          href={template.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-5 py-2.5 border border-zinc-300 text-zinc-900 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
        >
          查看演示站
        </a>
      </div>
    </div>
  );
}

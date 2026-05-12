import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import BlogPostCard from "@/components/blog/BlogPostCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "发现博客",
  description: "浏览最新发布的个人博客",
};

export default async function HomePage() {
  const session = await auth();
  const profiles = await prisma.profile.findMany({
    where: { sitePublished: true },
    include: { user: { select: { username: true } } },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  const actionHref = session?.user?.username ? `/${session.user.username}` : "/register";
  const actionLabel = session?.user?.username ? "开始写博客" : "成为第一个";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">发现博客</h1>
        <p className="mt-2 text-neutral-muted">浏览最新发布的个人博客</p>
      </div>

      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-20">
          <p className="text-lg text-neutral-muted">还没有人发布博客</p>
          <Link href={actionHref} className="mt-4 rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90">
            {actionLabel}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Link key={p.id} href={`/${p.user.username}`}>
              <BlogPostCard
                title={p.displayName}
                description={p.bio ?? undefined}
                avatarUrl={p.avatarUrl ?? undefined}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

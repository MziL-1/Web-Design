import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import BlogPageClient from "./BlogPageClient";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: { profile: true },
  });
  if (!user?.profile) return { title: "未找到" };
  return {
    title: user.profile.displayName,
    description: user.profile.bio ?? `${user.profile.displayName} 的个人博客`,
    alternates: { types: { "application/rss+xml": `/${username}/rss.xml` } },
    openGraph: {
      title: user.profile.displayName,
      description: user.profile.bio ?? undefined,
      images: user.profile.avatarUrl ? [user.profile.avatarUrl] : [],
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: { profile: true },
  });

  if (!user) notFound();

  const session = await auth();
  const isOwner = session?.user?.username === username;

  if (!isOwner && !user.profile?.sitePublished) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <h1 className="text-2xl font-bold text-neutral-muted">暂未发布</h1>
        <p className="mt-2 text-neutral-muted">这个博客还没有对外发布</p>
      </div>
    );
  }

  const posts = await prisma.post.findMany({
    where: {
      userId: user.id,
      ...(isOwner ? {} : { published: true }),
    },
    select: {
      id: true,
      title: true,
      content: true,
      published: true,
      createdAt: true,
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <BlogPageClient
      username={username}
      profile={user.profile!}
      posts={posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
      isOwner={isOwner}
    />
  );
}

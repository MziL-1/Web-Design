import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import BlogPostCard from "@/components/blog/BlogPostCard";
import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "发现博客",
  description: "浏览最新发布的个人博客",
};

export default async function HomePage() {
  const session = await auth();
  const profiles = await prisma.profile.findMany({
    where: { sitePublished: true },
    include: {
      user: {
        select: {
          username: true,
          _count: { select: { posts: { where: { published: true } } } },
        },
      },
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  let followingIds: string[] = [];
  if (session?.user?.id) {
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    followingIds = following.map((f) => f.followingId);
  }

  return (
    <HomePageClient
      sessionUsername={session?.user?.username ?? null}
      loggedIn={!!session}
      profiles={profiles.map((p) => ({
        id: p.id,
        username: p.user.username,
        displayName: p.displayName,
        bio: p.bio,
        avatarUrl: p.avatarUrl,
        postCount: p.user._count.posts,
        tags: p.tags,
        isFollowing: followingIds.includes(p.userId),
      }))}
    />
  );
}

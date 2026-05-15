import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "发现博客",
  description: "浏览最新发布的个人博客",
};

export default async function HomePage() {
  const session = await auth();

  const posts = await prisma.post.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      content: true,
      coverImage: true,
      createdAt: true,
      userId: true,
      _count: { select: { comments: true, likes: true } },
      user: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let followingIds: string[] = [];
  let followingProfiles: any[] = [];
  if (session?.user?.id) {
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    followingIds = following.map((f) => f.followingId);

    if (followingIds.length > 0) {
      followingProfiles = await prisma.profile.findMany({
        where: { userId: { in: followingIds } },
        include: {
          user: {
            select: {
              username: true,
              _count: { select: { posts: { where: { published: true } } } },
            },
          },
          tags: { include: { tag: true } },
        },
      });
    }
  }

  return (
    <HomePageClient
      sessionUsername={session?.user?.username ?? null}
      loggedIn={!!session}
      discoverPosts={posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        isFollowing: followingIds.includes(p.userId),
      }))}
      followingProfiles={followingProfiles.map((fp) => ({
        id: fp.id,
        username: fp.user.username,
        displayName: fp.displayName,
        bio: fp.bio,
        avatarUrl: fp.avatarUrl,
        postCount: fp.user._count.posts,
        tags: fp.tags,
      }))}
    />
  );
}

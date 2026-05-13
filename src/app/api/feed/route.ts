import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pageRaw = parseInt(searchParams.get("page") || "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const following = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);
  if (followingIds.length === 0) {
    return NextResponse.json({ posts: [], hasMore: false });
  }

  const posts = await prisma.post.findMany({
    where: { userId: { in: followingIds }, published: true },
    include: {
      user: { include: { profile: true } },
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit + 1,
  });

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  return NextResponse.json({ posts, hasMore });
}

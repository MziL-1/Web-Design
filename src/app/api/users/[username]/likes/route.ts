import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const likes = await prisma.like.findMany({
    where: { userId: user.id },
    include: {
      post: {
        include: { user: { select: { username: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    posts: likes.map((l) => ({
      id: l.post.id,
      title: l.post.title,
      username: l.post.user.username,
      likedAt: l.createdAt,
    })),
  });
}

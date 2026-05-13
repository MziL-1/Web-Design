import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { userId_postId: { userId, postId: id } },
      });
      if (existing) {
        await tx.like.delete({ where: { id: existing.id } });
        return { liked: false };
      }
      await tx.like.create({ data: { userId, postId: id } });
      return { liked: true };
    });

    const count = await prisma.like.count({ where: { postId: id } });
    return NextResponse.json({ liked: result.liked, count });
  } catch {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

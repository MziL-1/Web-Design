import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { post: { select: { userId: true } } },
  });

  if (!comment) return NextResponse.json({ error: "评论不存在" }, { status: 404 });
  if (comment.post.userId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

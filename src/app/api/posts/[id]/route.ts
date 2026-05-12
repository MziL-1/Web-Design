import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateField } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { username: true } },
      _count: { select: { comments: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();

  const titleErr = validateField(body.title, "标题", 1, 200);
  if (titleErr) return NextResponse.json({ error: titleErr }, { status: 400 });

  if (typeof body.content === "string" && body.content.length > 50000) {
    return NextResponse.json({ error: "文章内容不能超过50000字符" }, { status: 400 });
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { title: body.title, content: body.content, published: body.published },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

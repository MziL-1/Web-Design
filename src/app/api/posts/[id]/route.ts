import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateField } from "@/lib/validation";
import { triggerDeploy } from "@/lib/sync";

function extractFirstImage(content: string): string | null {
  const match = content.match(/!\[.*?\]\((\S+?)\)/);
  return match ? match[1] : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { username: true } },
      _count: { select: { comments: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
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

  const content = body.content as string;
  const hasCover = body.coverImage !== undefined;
  let coverImage: string | null | undefined;
  if (hasCover) {
    if (body.coverImage === null) {
      coverImage = null;
    } else if (typeof body.coverImage === "string" && body.coverImage) {
      coverImage = body.coverImage;
    } else {
      coverImage = extractFirstImage(content);
    }
  }

  const data: any = {
    title: body.title,
    content,
    published: body.published,
  };
  if (hasCover) data.coverImage = coverImage;

  const updated = await prisma.post.update({
    where: { id },
    data,
  });

  triggerDeploy(session.user.id);

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

  const result = await prisma.post.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  triggerDeploy(session.user.id);

  return NextResponse.json({ success: true });
}

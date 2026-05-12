import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateField } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();

  const titleErr = validateField(body.title, "标题", 1, 200);
  if (titleErr) return NextResponse.json({ error: titleErr }, { status: 400 });

  if (typeof body.content === "string" && body.content.length > 50000) {
    return NextResponse.json({ error: "文章内容不能超过50000字符" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content ?? "",
      published: body.published ?? true,
      userId: session.user.id,
    },
  });

  if (body.published !== false) {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { sitePublished: true },
    });
    if (profile && !profile.sitePublished) {
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: { sitePublished: true },
      });
    }
  }

  return NextResponse.json(post, { status: 201 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "缺少username参数" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json([]);

  const posts = await prisma.post.findMany({
    where: { userId: user.id, published: true },
    include: { _count: { select: { comments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

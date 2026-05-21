import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateField } from "@/lib/validation";
import { triggerDeploy } from "@/lib/sync";

function extractFirstImage(content: string): string | null {
  const match = content.match(/!\[.*?\]\((\S+)\)/);
  return match ? match[1] : null;
}

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
      coverImage:
        typeof body.coverImage === "string" && body.coverImage
          ? body.coverImage
          : extractFirstImage(body.content ?? ""),
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

  triggerDeploy(session.user.id);

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

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { userId: user.id, published: true },
      select: {
        id: true,
        title: true,
        coverImage: true,
        createdAt: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.post.count({
      where: { userId: user.id, published: true },
    }),
  ]);

  return NextResponse.json({
    posts,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

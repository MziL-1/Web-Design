import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const allowed = await checkRateLimit(ip, "public_read");
  if (!allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      posts: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          coverImage: true,
          createdAt: true,
          tags: { include: { tag: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const posts = user.posts.map((post) => ({
    id: post.id,
    title: post.title,
    coverImage: post.coverImage,
    createdAt: post.createdAt,
    tags: post.tags.map((pt) => pt.tag.name),
  }));

  return NextResponse.json(posts, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

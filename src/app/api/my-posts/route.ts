import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { comments: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(posts);
}

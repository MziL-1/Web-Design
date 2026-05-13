import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { username } = await params;
    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    if (target.id === session.user.id) return NextResponse.json({ error: "不能关注自己" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: { followerId_followingId: { followerId: session.user.id, followingId: target.id } },
      });

      if (existing) {
        await tx.follow.delete({ where: { id: existing.id } });
        return { following: false };
      }

      await tx.follow.create({
        data: { followerId: session.user.id, followingId: target.id },
      });
      return { following: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Follow toggle error:", error);
    return NextResponse.json({ error: "操作失败，请稍后重试" }, { status: 500 });
  }
}

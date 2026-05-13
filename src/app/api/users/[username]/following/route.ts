import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: { following: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    count: following.length,
    following: following.map((f) => ({
      id: f.following.id,
      username: f.following.username,
      displayName: f.following.profile?.displayName ?? f.following.username,
      avatarUrl: f.following.profile?.avatarUrl,
    })),
  });
}

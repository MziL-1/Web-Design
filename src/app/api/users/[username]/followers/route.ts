import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const followers = await prisma.follow.findMany({
    where: { followingId: user.id },
    include: { follower: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    count: followers.length,
    followers: followers.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      displayName: f.follower.profile?.displayName ?? f.follower.username,
      avatarUrl: f.follower.profile?.avatarUrl,
    })),
  });
}

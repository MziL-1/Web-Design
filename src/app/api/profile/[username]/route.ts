import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: { profile: true },
  });

  if (!user || !user.profile) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    displayName: user.profile.displayName,
    bio: user.profile.bio,
    avatarUrl: user.profile.avatarUrl,
    sitePublished: user.profile.sitePublished,
  });
}

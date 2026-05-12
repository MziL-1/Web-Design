import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateField } from "@/lib/validation";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();

  const nameErr = validateField(body.displayName, "显示名称", 1, 50);
  if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });

  if (body.bio && typeof body.bio === "string" && body.bio.length > 500) {
    return NextResponse.json({ error: "简介不能超过500字符" }, { status: 400 });
  }

  const data: Record<string, unknown> = {
    displayName: body.displayName,
    bio: body.bio ?? null,
  };
  if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
  if (body.sitePublished !== undefined) data.sitePublished = body.sitePublished;

  const profile = await prisma.profile.update({
    where: { userId: session.user.id },
    data,
  });

  return NextResponse.json(profile);
}

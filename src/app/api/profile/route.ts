import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateField } from "@/lib/validation";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();

  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    const nameErr = validateField(body.displayName, "显示名称", 1, 50);
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });
    data.displayName = body.displayName;
  }

  if (body.bio !== undefined) {
    if (typeof body.bio === "string" && body.bio.length > 500) {
      return NextResponse.json({ error: "简介不能超过500字符" }, { status: 400 });
    }
    data.bio = body.bio;
  }

  if (body.avatarUrl !== undefined) {
    if (body.avatarUrl !== null) {
      if (typeof body.avatarUrl !== "string" || body.avatarUrl.length > 2048) {
        return NextResponse.json({ error: "头像URL格式不正确" }, { status: 400 });
      }
      if (
        !body.avatarUrl.startsWith("https://") &&
        !body.avatarUrl.startsWith("data:") &&
        !body.avatarUrl.startsWith("/")
      ) {
        return NextResponse.json({ error: "头像URL格式不正确" }, { status: 400 });
      }
    }
    data.avatarUrl = body.avatarUrl;
  }

  if (body.sitePublished !== undefined) {
    if (typeof body.sitePublished !== "boolean") {
      return NextResponse.json({ error: "sitePublished必须是布尔值" }, { status: 400 });
    }
    data.sitePublished = body.sitePublished;
  }

  const profile = await prisma.profile.update({
    where: { userId: session.user.id },
    data,
  });

  return NextResponse.json(profile);
}

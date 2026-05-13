import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateField } from "@/lib/validation";

export async function PUT(request: Request) {
  try {
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
      if (body.bio !== null && (typeof body.bio !== "string" || body.bio.length > 50)) {
        return NextResponse.json({ error: "简介不能超过50字符" }, { status: 400 });
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

    if (body.tagIds !== undefined && Array.isArray(body.tagIds)) {
      if (body.tagIds.length > 6) {
        return NextResponse.json({ error: "最多选择6个标签" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        if (body.tagIds.length > 0) {
          const existingTags = await tx.tag.findMany({
            where: { id: { in: body.tagIds } },
          });
          if (existingTags.length !== body.tagIds.length) {
            throw new Error("INVALID_TAG");
          }
        }

        await tx.profileTag.deleteMany({ where: { profileId: profile.id } });

        if (body.tagIds.length > 0) {
          await tx.profileTag.createMany({
            data: body.tagIds.map((tagId: string) => ({ profileId: profile.id, tagId })),
          });
        }
      });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    if (error?.message === "INVALID_TAG") {
      return NextResponse.json({ error: "无效的标签ID" }, { status: 400 });
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "更新失败，请稍后重试" }, { status: 500 });
  }
}

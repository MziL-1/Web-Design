import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

  const profiles = await prisma.profile.findMany({
    where: { sitePublished: true },
    include: { user: { select: { username: true } } },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * 12,
    take: 12,
  });

  return NextResponse.json(profiles);
}

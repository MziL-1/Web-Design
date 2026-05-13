import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTagName } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const tags = await prisma.tag.findMany({
    where: q ? { name: { contains: q } } : {},
    orderBy: { name: "asc" },
    take: 50,
    select: { id: true, name: true },
  });

  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { name } = await req.json();
  const err = validateTagName(name);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const existing = await prisma.tag.findUnique({ where: { name } });
  if (existing) return NextResponse.json(existing, { status: 409 });

  const tag = await prisma.tag.create({ data: { name } });
  return NextResponse.json(tag, { status: 201 });
}

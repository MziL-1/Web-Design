import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.templateId || typeof body.templateId !== "string") {
    return NextResponse.json({ error: "缺少templateId" }, { status: 400 });
  }

  if (!body.deployHookUrl || typeof body.deployHookUrl !== "string") {
    return NextResponse.json({ error: "缺少deployHookUrl" }, { status: 400 });
  }

  if (!body.deployHookUrl.startsWith("https://api.vercel.com/")) {
    return NextResponse.json(
      { error: "deployHookUrl必须是Vercel deploy hook URL" },
      { status: 400 }
    );
  }

  const deployment = await prisma.siteDeployment.upsert({
    where: { userId: session.user.id },
    update: {
      templateId: body.templateId,
      deployHookUrl: body.deployHookUrl,
      siteUrl: typeof body.siteUrl === "string" ? body.siteUrl : null,
    },
    create: {
      userId: session.user.id,
      templateId: body.templateId,
      deployHookUrl: body.deployHookUrl,
      siteUrl: typeof body.siteUrl === "string" ? body.siteUrl : null,
    },
  });

  return NextResponse.json(deployment);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const deployment = await prisma.siteDeployment.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(deployment);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const existing = await prisma.siteDeployment.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "没有部署记录" }, { status: 404 });
  }

  await prisma.siteDeployment.delete({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}

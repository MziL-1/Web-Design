import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTemplate } from "@/lib/templates";
import { autoDeploy } from "@/lib/vercel-api";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: { templateId?: string; vercelToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const { templateId, vercelToken } = body;

  if (!templateId) {
    return NextResponse.json({ error: "请选择模板" }, { status: 400 });
  }

  if (!vercelToken || typeof vercelToken !== "string" || !vercelToken.trim()) {
    return NextResponse.json({ error: "请输入 Vercel Access Token" }, { status: 400 });
  }

  const template = getTemplate(templateId);
  if (!template) {
    return NextResponse.json({ error: "模板不存在" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const platformUrl = process.env.NEXTAUTH_URL || "https://web-design-two-phi.vercel.app";

  try {
    const result = await autoDeploy(
      vercelToken.trim(),
      template.repoFullName,
      template.repoBranch,
      templateId,
      user.username,
      platformUrl
    );

    const deployment = await prisma.siteDeployment.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        templateId,
        deployHookUrl: result.deployHookUrl,
        siteUrl: result.siteUrl,
        vercelProjectId: result.projectId,
      },
      update: {
        templateId,
        deployHookUrl: result.deployHookUrl,
        siteUrl: result.siteUrl,
        vercelProjectId: result.projectId,
      },
    });

    return NextResponse.json({
      success: true,
      siteUrl: result.siteUrl,
      templateId,
      projectId: result.projectId,
      deployment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "部署失败，请检查 Token 是否有效" },
      { status: 500 }
    );
  }
}

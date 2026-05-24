import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createVercelDeployHook } from "@/lib/vercel-api";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const deployment = await prisma.siteDeployment.findUnique({
    where: { userId: session.user.id },
  });

  if (!deployment || !deployment.vercelProjectId) {
    return NextResponse.json({ error: "没有已部署的项目" }, { status: 404 });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  if (!body.token) {
    return NextResponse.json({ error: "请输入 Vercel Token" }, { status: 400 });
  }

  try {
    const hook = await createVercelDeployHook(
      body.token,
      deployment.vercelProjectId,
      "Blog Platform Sync",
      "main",
    );

    const url = hook.url || `${process.env.NEXTAUTH_URL || "https://api.vercel.com"}/v1/integrations/deploy/${deployment.vercelProjectId}/${hook.id}`;
    
    // Construct proper Vercel deploy hook URL
    const deployHookUrl = url.startsWith("http") ? url
      : `https://api.vercel.com/v1/integrations/deploy/${encodeURIComponent(deployment.vercelProjectId!)}/${hook.id}`;

    const updated = await prisma.siteDeployment.update({
      where: { userId: session.user.id },
      data: { deployHookUrl },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "修复失败" },
      { status: 500 },
    );
  }
}

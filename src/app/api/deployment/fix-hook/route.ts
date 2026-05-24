import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

  const updated = await prisma.siteDeployment.update({
    where: { userId: session.user.id },
    data: { vercelToken: body.token },
  });

  return NextResponse.json(updated);
}

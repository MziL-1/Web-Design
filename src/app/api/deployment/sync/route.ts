import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerDeploy } from "@/lib/sync";

export async function POST(_request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const deployment = await prisma.siteDeployment.findUnique({
    where: { userId: session.user.id },
  });

  if (!deployment) {
    return NextResponse.json({ error: "未配置部署" }, { status: 404 });
  }

  await triggerDeploy(session.user.id, true);

  const updated = await prisma.siteDeployment.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    success: updated?.lastSyncStatus === "success",
    status: updated?.lastSyncStatus,
    error: updated?.lastSyncError,
  });
}

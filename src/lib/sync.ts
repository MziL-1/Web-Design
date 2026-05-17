import { prisma } from "@/lib/prisma";

export async function triggerDeploy(userId: string) {
  const deployment = await prisma.siteDeployment.findUnique({
    where: { userId },
  });

  if (!deployment) return;

  try {
    const res = await fetch(deployment.deployHookUrl, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Vercel responded ${res.status}`);
    }

    await prisma.siteDeployment.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        lastSyncError: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.siteDeployment.update({
      where: { userId },
      data: {
        lastSyncStatus: "failed",
        lastSyncError: message,
      },
    });
  }
}

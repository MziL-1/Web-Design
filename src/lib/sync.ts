import { prisma } from "@/lib/prisma";
import { triggerVercelRedeploy } from "@/lib/vercel-api";

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export async function triggerDeploy(userId: string, immediate = false) {
  if (!immediate) {
    if (debounceTimers.has(userId)) {
      clearTimeout(debounceTimers.get(userId));
    }
    debounceTimers.set(
      userId,
      setTimeout(() => {
        debounceTimers.delete(userId);
        doDeploy(userId);
      }, 3000),
    );
    return;
  }

  return doDeploy(userId);
}

async function doDeploy(userId: string) {
  const deployment = await prisma.siteDeployment.findUnique({
    where: { userId },
  });

  if (!deployment) return;

  const token = deployment.vercelToken;
  const projectId = deployment.vercelProjectId;

  if (!projectId || !token) {
    try {
      await prisma.siteDeployment.update({
        where: { userId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "failed",
          lastSyncError: "缺少 Vercel Token 或项目ID，请重新部署",
        },
      });
    } catch {}
    return;
  }

  try {
    await triggerVercelRedeploy(token, projectId);

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
    try {
      await prisma.siteDeployment.update({
        where: { userId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "failed",
          lastSyncError: message,
        },
      });
    } catch {}
  }
}

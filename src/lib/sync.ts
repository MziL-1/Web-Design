import { prisma } from "@/lib/prisma";

function validateDeployHookUrl(url: string): boolean {
  if (!url.startsWith("https://api.vercel.com/")) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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
      }, 3000)
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

  if (!validateDeployHookUrl(deployment.deployHookUrl)) {
    try {
      await prisma.siteDeployment.update({
        where: { userId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "failed",
          lastSyncError: "Invalid deploy hook URL",
        },
      });
    } catch {}
    return;
  }

  try {
    const res = await fetch(deployment.deployHookUrl, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      let detail = "";
      try {
        detail = await res.text();
      } catch {}
      throw new Error(`Vercel responded ${res.status}${detail ? ": " + detail : ""}`);
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

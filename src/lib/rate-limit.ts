import { prisma } from "@/lib/prisma";

const LIMITS: Record<string, { count: number; windowSec: number }> = {
  comment: { count: 5, windowSec: 60 },
  register: { count: 3, windowSec: 3600 },
  import: { count: 10, windowSec: 60 },
};

export async function checkRateLimit(
  ip: string,
  action: string
): Promise<boolean> {
  const limit = LIMITS[action];
  if (!limit) return true;

  const since = new Date(Date.now() - limit.windowSec * 1000);

  const count = await prisma.rateLimit.count({
    where: { ip, action, createdAt: { gte: since } },
  });

  if (count >= limit.count) return false;

  await prisma.rateLimit.create({ data: { ip, action } });
  return true;
}

export async function checkCommentDuplicate(
  ip: string,
  postId: string,
  content: string
): Promise<boolean> {
  const since = new Date(Date.now() - 30 * 1000);
  const existing = await prisma.comment.findFirst({
    where: { postId, content, createdAt: { gte: since } },
  });
  return !!existing;
}

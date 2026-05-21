import { prisma } from "@/lib/prisma";

const LIMITS: Record<string, { count: number; windowSec: number }> = {
  comment: { count: 5, windowSec: 60 },
  register: { count: 3, windowSec: 3600 },
  import: { count: 10, windowSec: 60 },
  public_read: { count: 60, windowSec: 60 },
};

const hits = new Map<string, number[]>();

const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const oldest = now - 7200 * 1000;
  for (const [key, timestamps] of hits) {
    while (timestamps.length > 0 && timestamps[0] < oldest) timestamps.shift();
    if (timestamps.length === 0) hits.delete(key);
  }
}

export async function checkRateLimit(
  ip: string,
  action: string
): Promise<boolean> {
  const limit = LIMITS[action];
  if (!limit) return false;

  cleanup();

  const key = `${ip}:${action}`;
  const now = Date.now();
  const windowStart = now - limit.windowSec * 1000;

  let timestamps = hits.get(key);
  if (!timestamps) {
    timestamps = [];
    hits.set(key, timestamps);
  }

  while (timestamps.length > 0 && timestamps[0] <= windowStart) timestamps.shift();

  if (timestamps.length >= limit.count) return false;

  timestamps.push(now);
  return true;
}

export async function checkCommentDuplicate(
  _ip: string,
  postId: string,
  content: string
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - 30 * 1000);
    const existing = await prisma.comment.findFirst({
      where: { postId, content, createdAt: { gte: since } },
    });
    return !!existing;
  } catch {
    return false;
  }
}

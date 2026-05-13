import { prisma } from './prisma';

export interface SearchResults {
  users: Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>;
  posts: Array<{ id: string; title: string; username: string; createdAt: Date }>;
  tags: Array<{ id: string; name: string }>;
}

export async function searchAll(query: string, limit = 20): Promise<SearchResults> {
  const [users, posts, tags] = await Promise.all([
    prisma.user.findMany({
      where: { username: { contains: query } },
      select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
      take: limit,
    }),
    prisma.post.findMany({
      where: { title: { contains: query }, published: true },
      select: { id: true, title: true, createdAt: true, user: { select: { username: true } } },
      take: limit,
    }),
    prisma.tag.findMany({
      where: { name: { contains: query } },
      select: { id: true, name: true },
      take: limit,
    }),
  ]);

  return {
    users: users.map(u => ({ id: u.id, username: u.username, displayName: u.profile?.displayName ?? u.username, avatarUrl: u.profile?.avatarUrl ?? null })),
    posts: posts.map(p => ({ id: p.id, title: p.title, username: p.user.username, createdAt: p.createdAt })),
    tags,
  };
}

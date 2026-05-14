import { prisma } from './prisma';

export interface SearchResults {
  users: Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>;
  posts: Array<{
    id: string;
    title: string;
    content: string;
    coverImage: string | null;
    createdAt: Date;
    user: { username: string; profile: { displayName: string; avatarUrl: string | null } | null };
    tags: Array<{ tag: { id: string; name: string } }>;
  }>;
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
      select: {
        id: true,
        title: true,
        content: true,
        coverImage: true,
        createdAt: true,
        user: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        tags: { include: { tag: true } },
      },
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
    posts: posts.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      coverImage: p.coverImage,
      createdAt: p.createdAt,
      user: { username: p.user.username, profile: p.user.profile ? { displayName: p.user.profile.displayName, avatarUrl: p.user.profile.avatarUrl } : null },
      tags: p.tags,
    })),
    tags,
  };
}

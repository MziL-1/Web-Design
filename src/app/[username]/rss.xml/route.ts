import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: true,
      posts: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) notFound();

  const postsXml = (user.posts ?? [])
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${process.env.NEXTAUTH_URL ?? ""}/${username}/${post.id}</link>
      <description>${escapeXml(post.content.slice(0, 200))}</description>
      <pubDate>${post.createdAt.toUTCString()}</pubDate>
      <guid>${post.id}</guid>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(user.profile?.displayName ?? username)}</title>
    <description>${escapeXml(user.profile?.bio ?? "")}</description>
    <link>${process.env.NEXTAUTH_URL ?? ""}/${username}</link>
${postsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

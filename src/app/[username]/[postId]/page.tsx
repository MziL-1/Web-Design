import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import PostPageClient from "./PostPageClient";

interface Props {
  params: Promise<{ username: string; postId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { title: "文章未找到" };
  return {
    title: post.title,
    description: post.content.slice(0, 160),
  };
}

export default async function PostPage({ params }: Props) {
  const { username, postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: { select: { username: true } } },
  });

  if (!post) notFound();
  if (post.user.username !== username) notFound();

  const session = await auth();
  const isOwner = session?.user?.username === username;

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PostPageClient
      post={{
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt.toISOString(),
      }}
      comments={comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))}
      isOwner={isOwner}
      username={username}
      postId={postId}
      currentUsername={session?.user?.username}
    />
  );
}

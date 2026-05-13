"use client";

import Link from "next/link";
import BlogPostContent from "@/components/blog/BlogPostContent";
import CommentSection from "@/components/blog/CommentSection";
import LikeButton from "@/components/blog/LikeButton";
import { ToastProvider } from "@/components/ui/Toast";

interface PostData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface CommentData {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface Props {
  post: PostData;
  comments: CommentData[];
  isOwner: boolean;
  username: string;
  postId: string;
  currentUsername?: string;
  likeCount?: number;
  liked?: boolean;
}

export default function PostPageClient({ post, comments, isOwner, username, postId, currentUsername, likeCount = 0, liked = false }: Props) {
  return (
    <ToastProvider>
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/${username}`}
          className="mb-4 inline-block text-sm text-neutral-muted hover:text-primary"
        >
          &larr; 返回 {username} 的博客
        </Link>

        <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>
        <time className="mb-8 block text-sm text-neutral-muted">
          {new Date(post.createdAt).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <BlogPostContent content={post.content} />
        </div>

        <div className="mt-4">
          <LikeButton postId={postId} initialLiked={liked} initialCount={likeCount} />
        </div>

        <CommentSection
          postId={postId}
          initialComments={comments}
          isOwner={isOwner}
          currentUsername={currentUsername}
        />
      </div>
    </ToastProvider>
  );
}

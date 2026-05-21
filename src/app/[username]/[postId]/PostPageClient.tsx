"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import LikeButton from "@/components/blog/LikeButton";
import { ToastProvider } from "@/components/ui/Toast";

const BlogPostContent = dynamic(() => import("@/components/blog/BlogPostContent"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg" />,
});
const CommentSection = dynamic(() => import("@/components/blog/CommentSection"), {
  ssr: false,
  loading: () => <div className="mt-16 h-32 bg-gray-50 animate-pulse rounded-xl" />,
});

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
      <article className="mx-auto max-w-[720px] px-6 pt-12 pb-16">
        <Link
          href={`/${username}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-950 transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回 {username} 的博客
        </Link>

        <h1 className="font-display text-4xl font-medium leading-tight text-gray-950 mb-6">
          {post.title}
        </h1>

        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              <span className="text-sm font-semibold text-gray-600">{username[0].toUpperCase()}</span>
            </div>
            <div className="flex flex-col">
              <Link href={`/${username}`} className="font-medium text-gray-950 text-sm hover:text-blue-600">
                {username}
              </Link>
              <span className="text-xs text-gray-400">
                {new Date(post.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LikeButton postId={postId} initialLiked={liked} initialCount={likeCount} />
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-950 transition-all bg-transparent cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="text-[17px] leading-[1.8] text-gray-950 mb-8">
          <BlogPostContent content={post.content} />
        </div>

        <CommentSection
          postId={postId}
          initialComments={comments}
          isOwner={isOwner}
          currentUsername={currentUsername}
        />
      </article>
    </ToastProvider>
  );
}

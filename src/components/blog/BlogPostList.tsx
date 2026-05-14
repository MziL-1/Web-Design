"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import TagBadge from "@/components/blog/TagBadge";
import type { PostItem } from "@/lib/types";

interface BlogPostListProps {
  posts: PostItem[];
  isOwner: boolean;
  username: string;
  onNewPost: () => void;
  onEditPost: (post: PostItem) => void;
  onDeletePost: (post: PostItem) => void;
}

function stripMarkdown(text: string): string {
  return text.replace(/[#*`>\[\]()!\-_~=+|{}.]/g, "").replace(/\n+/g, " ").trim();
}

export default function BlogPostList({
  posts,
  isOwner,
  username,
  onNewPost,
  onEditPost,
  onDeletePost,
}: BlogPostListProps) {
  const router = useRouter();

  if (posts.length === 0) {
    return (
      <div className="mt-8">
        {isOwner && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-medium text-gray-950">文章</h2>
            <Button size="sm" onClick={onNewPost}>写文章</Button>
          </div>
        )}
        <EmptyState
          message={isOwner ? "还没有文章，点击「写文章」开始创作" : "这个博客还没有文章"}
          actionLabel={isOwner ? "写文章" : undefined}
          onAction={isOwner ? onNewPost : undefined}
        />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-medium text-gray-950">文章 ({posts.length})</h2>
        {isOwner && <Button size="sm" onClick={onNewPost}>写文章</Button>}
      </div>

      <div className="flex flex-col gap-12">
        {posts.map((post) => (
          <article
            key={post.id}
            className={`pb-12 border-b border-gray-200 last:border-b-0 ${
              !post.published ? "opacity-60" : ""
            }`}
          >
            <div className="grid grid-cols-[1fr] md:grid-cols-[1fr_200px] gap-8">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-sm text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {!post.published && (
                    <span className="text-xs text-amber-600">(草稿)</span>
                  )}
                </div>

                <h3
                  onClick={() => router.push(`/${username}/${post.id}`)}
                  className="font-display text-[22px] font-medium leading-tight text-gray-950 cursor-pointer hover:text-blue-600 transition-colors mb-3"
                >
                  {post.title}
                </h3>

                {post.content && (
                  <p className="text-[15px] leading-relaxed text-gray-600 mb-4 line-clamp-2">
                    {stripMarkdown(post.content).slice(0, 160)}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-auto flex-wrap">
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((pt) => (
                        <TagBadge key={pt.tag.id} name={pt.tag.name} />
                      ))}
                    </div>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {post._count.likes} 点赞
                  </span>
                </div>
              </div>

              {isOwner && (
                <div
                  className="flex md:flex-col gap-2 md:justify-center md:items-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="secondary" size="sm" onClick={() => onEditPost(post)}>
                    编辑
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDeletePost(post)}>
                    删除
                  </Button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

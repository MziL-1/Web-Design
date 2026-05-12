"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import type { PostItem } from "@/lib/types";

interface BlogPostListProps {
  posts: PostItem[];
  isOwner: boolean;
  username: string;
  onNewPost: () => void;
  onEditPost: (post: PostItem) => void;
  onDeletePost: (post: PostItem) => void;
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">文章</h2>
          {isOwner && <Button size="sm" onClick={onNewPost}>写文章</Button>}
        </div>
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">文章 ({posts.length})</h2>
        {isOwner && <Button size="sm" onClick={onNewPost}>写文章</Button>}
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => router.push(`/${username}/${post.id}`)}
            className={`cursor-pointer rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
              !post.published ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-lg font-semibold hover:text-primary">
                  {post.title}
                  {!post.published && (
                    <span className="ml-2 text-xs text-warning">(草稿)</span>
                  )}
                </span>
                <div className="mt-1 flex items-center gap-3 text-sm text-neutral-muted">
                  <span>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</span>
                  <span>{post._count.comments} 条评论</span>
                </div>
              </div>
              {isOwner && (
                <div
                  className="flex gap-2"
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
          </div>
        ))}
      </div>
    </div>
  );
}

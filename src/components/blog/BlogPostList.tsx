"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import BlogPostCard from "@/components/blog/BlogPostCard";
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
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/[#*`>\[\]()!\-_~=+|{}.]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
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
          <div
            key={post.id}
            className={`group cursor-pointer pb-12 border-b border-gray-200 last:border-b-0 ${
              !post.published ? "opacity-60" : ""
            }`}
            onClick={() => router.push(`/${username}/${post.id}`)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <BlogPostCard
                  title={post.title}
                  description={post.content ? stripMarkdown(post.content).slice(0, 160) : undefined}
                  date={new Date(post.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  imageUrl={post.coverImage ?? undefined}
                  stats={[
                    { label: "点赞", value: String(post._count.likes) },
                    { label: "条评论", value: String(post._count.comments) },
                  ]}
                  tags={post.tags}
                />
              </div>
              {isOwner && (
                <div
                  className="flex gap-2 shrink-0 pt-1"
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

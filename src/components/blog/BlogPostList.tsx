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

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => router.push(`/${username}/${post.id}`)}
            className={`cursor-pointer rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 ${
              !post.published ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {post.title}
                  {!post.published && (
                    <span className="ml-2 text-xs text-amber-600 font-normal">(草稿)</span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  <span className="mx-2">·</span>
                  {post._count.comments} 条评论
                  {(post._count as any).likes > 0 && (
                    <>
                      <span className="mx-2">·</span>
                      {(post._count as any).likes} 个赞
                    </>
                  )}
                </p>
                {post.content && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {post.content.replace(/[#*`>\[\]()!\-_~]/g, "").slice(0, 150)}
                  </p>
                )}
                {(post as any).tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(post as any).tags.slice(0, 4).map((pt: { tag: { id: string; name: string } }) => (
                      <TagBadge key={pt.tag.id} name={pt.tag.name} />
                    ))}
                    {(post as any).tags.length > 4 && (
                      <span className="text-xs text-gray-400 self-center">+{(post as any).tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
              {isOwner && (
                <div
                  className="flex gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="secondary" size="sm" onClick={() => onEditPost(post)} aria-label={`编辑文章 ${post.title}`}>
                    编辑
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDeletePost(post)} aria-label={`删除文章 ${post.title}`}>
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

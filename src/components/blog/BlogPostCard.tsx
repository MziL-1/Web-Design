"use client";

import TagBadge from "./TagBadge";

interface BlogPostCardProps {
  title: string;
  description?: string;
  avatarUrl?: string;
  postCount?: number;
  tags?: Array<{ tag: { id: string; name: string } }>;
  isFollowing?: boolean;
}

export default function BlogPostCard({ title, description, avatarUrl, postCount, tags, isFollowing }: BlogPostCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600">
          {avatarUrl ? (
            <img src={avatarUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-white">{title[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 truncate">{title}</h2>
            {isFollowing && (
              <span className="shrink-0 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">已关注</span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{description}</p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.slice(0, 2).map((pt) => (
                <TagBadge key={pt.tag.id} name={pt.tag.name} />
              ))}
              {tags.length > 2 && <span className="text-xs text-gray-400 self-center">...</span>}
            </div>
          )}
          {postCount !== undefined && (
            <p className="mt-1 text-xs text-gray-400">{postCount} 篇文章</p>
          )}
        </div>
      </div>
    </div>
  );
}

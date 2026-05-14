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
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
          {avatarUrl ? (
            <img src={avatarUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-display font-semibold text-gray-600">{title[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-medium text-gray-950 truncate">{title}</h2>
            {isFollowing && (
              <span className="shrink-0 rounded px-2 py-0.5 text-[11px] font-medium text-blue-600 bg-blue-50">
                已关注
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-sm text-gray-600 line-clamp-1">{description}</p>
          )}
          {(postCount !== undefined || (tags && tags.length > 0)) && (
            <div className="flex items-center gap-2 mt-2">
              {postCount !== undefined && (
                <span className="text-xs text-gray-400">{postCount} 篇文章</span>
              )}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.slice(0, 2).map((pt) => (
                    <TagBadge key={pt.tag.id} name={pt.tag.name} />
                  ))}
                  {tags.length > 2 && <span className="text-xs text-gray-400">+{tags.length - 2}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

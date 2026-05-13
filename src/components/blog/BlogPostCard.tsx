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
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light">
          {avatarUrl ? (
            <img src={avatarUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-primary">{title[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold truncate">{title}</h2>
            {isFollowing && (
              <span className="shrink-0 text-xs text-primary bg-primary/5 px-1.5 py-0.5 rounded">你的关注</span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-neutral-muted">{description}</p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.slice(0, 2).map((pt) => (
                <TagBadge key={pt.tag.id} name={pt.tag.name} />
              ))}
              {tags.length > 2 && <span className="text-xs text-zinc-400 self-center">...</span>}
            </div>
          )}
          {postCount !== undefined && (
            <p className="mt-0.5 text-xs text-neutral-muted">{postCount} 篇文章</p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

interface BlogPostCardProps {
  title: string;
  description?: string;
  avatarUrl?: string;
  postCount?: number;
}

export default function BlogPostCard({ title, description, avatarUrl, postCount }: BlogPostCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light">
          {avatarUrl ? (
            <img src={avatarUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-primary">{title[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          {description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-neutral-muted">{description}</p>
          )}
          {postCount !== undefined && (
            <p className="mt-0.5 text-xs text-neutral-muted">{postCount} 篇文章</p>
          )}
        </div>
      </div>
    </div>
  );
}

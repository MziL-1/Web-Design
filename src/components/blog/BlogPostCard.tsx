"use client";

interface BlogPostCardProps {
  title: string;
  description?: string;
  avatarUrl?: string;
}

export default function BlogPostCard({ title, description, avatarUrl }: BlogPostCardProps) {
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
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-neutral-muted">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

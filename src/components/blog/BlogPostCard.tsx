"use client";

import TagBadge from "./TagBadge";

interface BlogPostCardProps {
  title: string;
  description?: string;
  authorName?: string;
  authorAvatar?: string;
  imageUrl?: string;
  date?: string;
  stats?: { label: string; value?: string }[];
  tags?: Array<{ tag: { id: string; name: string } }>;
  isFollowing?: boolean;
}

export default function BlogPostCard({
  title,
  description,
  authorName,
  authorAvatar,
  imageUrl,
  date,
  stats,
  tags,
  isFollowing,
}: BlogPostCardProps) {
  const hasImage = !!imageUrl;

  return (
    <div className={hasImage ? "grid grid-cols-[1fr_auto] gap-8" : ""}>
      <div className="flex flex-col">
        {(authorName || date) && (
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {authorName && (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">{authorName[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-950">
                  {authorName}
                  {isFollowing && (
                    <span className="ml-1.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium text-blue-600 bg-blue-50 align-middle">
                      我的关注
                    </span>
                  )}
                </span>
              </div>
            )}
            {date && (
              <span className="text-sm text-gray-400">{date}</span>
            )}
          </div>
        )}

        {title !== undefined && title !== "" && (
          <h2 className="font-display text-[22px] font-medium leading-tight text-gray-950 group-hover:text-blue-600 transition-colors mb-3">
            {title}
          </h2>
        )}

        {description && (
          <p className="text-[15px] leading-relaxed text-gray-600 mb-4 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap mt-auto">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((pt) => (
                <TagBadge key={pt.tag.id} name={pt.tag.name} />
              ))}
            </div>
          )}
          {stats && stats.length > 0 && stats.map((s, i) => (
            <span key={i} className="text-sm text-gray-400">
              {s.value ? `${s.value} ${s.label}` : s.label}
            </span>
          ))}
        </div>
      </div>

      {hasImage && (
        <div className="overflow-hidden rounded-xl shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-44 sm:w-52 lg:w-56 aspect-[4/3] object-cover transition-transform duration-300 hover:scale-110"
          />
        </div>
      )}
    </div>
  );
}

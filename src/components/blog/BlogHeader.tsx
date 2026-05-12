"use client";

import Button from "@/components/ui/Button";

interface BlogHeaderProps {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  isOwner: boolean;
  sitePublished: boolean;
  onEditProfile: () => void;
  onTogglePublished: () => void;
  toggling: boolean;
}

export default function BlogHeader({
  displayName,
  bio,
  avatarUrl,
  isOwner,
  sitePublished,
  onEditProfile,
  onTogglePublished,
  toggling,
}: BlogHeaderProps) {
  return (
    <div>
      {isOwner && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-sm text-primary">你正在编辑自己的博客</span>
          <button
            onClick={onTogglePublished}
            disabled={toggling}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              sitePublished
                ? "bg-accent text-white hover:bg-accent/90"
                : "bg-slate-200 text-neutral-muted hover:bg-slate-300"
            }`}
          >
            {toggling ? "更新中..." : sitePublished ? "已发布" : "未发布"}
          </button>
        </div>
      )}

      <div className="flex items-start gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-primary">{displayName[0]}</span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{displayName}</h1>
              {bio && <p className="mt-2 max-w-xl text-neutral-muted">{bio}</p>}
            </div>
            {isOwner && (
              <Button variant="secondary" size="sm" onClick={onEditProfile}>
                编辑个人信息
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

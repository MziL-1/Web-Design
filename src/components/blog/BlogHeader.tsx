"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FollowButton from "./FollowButton";
import TagBadge from "./TagBadge";
import ProfileDetailModal from "./ProfileDetailModal";

interface BlogHeaderProps {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  isOwner: boolean;
  sitePublished: boolean;
  onEditProfile: () => void;
  onTogglePublished: () => void;
  toggling: boolean;
  tags?: Array<{ tag: { id: string; name: string } }>;
  isFollowing?: boolean;
}

export default function BlogHeader({
  username,
  displayName,
  bio,
  avatarUrl,
  isOwner,
  sitePublished,
  onEditProfile,
  onTogglePublished,
  toggling,
  tags = [],
  isFollowing = false,
}: BlogHeaderProps) {
  const [detailOpen, setDetailOpen] = useState(false);

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
              <button
                onClick={() => setDetailOpen(true)}
                className="text-left hover:opacity-80 transition-opacity"
              >
                <h1 className="text-3xl font-bold">{displayName}</h1>
              </button>
              {bio && <p className="mt-1 text-sm text-neutral-muted line-clamp-1">{bio}</p>}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {tags.slice(0, 2).map((pt) => (
                    <TagBadge key={pt.tag.id} name={pt.tag.name} />
                  ))}
                  {tags.length > 2 && (
                    <span className="text-xs text-zinc-400 self-center">+{tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOwner ? (
                <Button variant="secondary" size="sm" onClick={onEditProfile}>
                  编辑个人信息
                </Button>
              ) : (
                <FollowButton
                  username={username}
                  initialIsFollowing={isFollowing}
                  isOwnProfile={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ProfileDetailModal
        username={username}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}

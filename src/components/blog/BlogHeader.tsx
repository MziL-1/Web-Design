"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FollowButton from "./FollowButton";
import TagBadge from "./TagBadge";
import ProfileDetailModal from "./ProfileDetailModal";
import { MessageCircle } from "lucide-react";

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
  const router = useRouter();

  return (
    <div className="text-center pt-16 pb-12 border-b border-gray-200">
      {isOwner && (
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="text-sm text-blue-600">你正在编辑自己的博客</span>
          <button
            onClick={onTogglePublished}
            disabled={toggling}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              sitePublished
                ? "bg-gray-950 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {toggling ? "更新中..." : sitePublished ? "已发布" : "未发布"}
          </button>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 mb-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl font-semibold text-gray-400">{displayName[0]}</span>
          )}
        </div>

        <button
          onClick={() => setDetailOpen(true)}
          className="hover:opacity-80 transition-opacity"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-gray-950 mb-2">{displayName}</h1>
        </button>

        {bio && (
          <p className="text-base text-gray-600 max-w-[500px] mx-auto mb-5 leading-relaxed">
            {bio}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {tags.map((pt) => (
              <TagBadge key={pt.tag.id} name={pt.tag.name} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {isOwner ? (
            <Button variant="secondary" size="sm" onClick={onEditProfile}>
              编辑个人信息
            </Button>
          ) : (
            <>
              <FollowButton
                username={username}
                initialIsFollowing={isFollowing}
                isOwnProfile={false}
              />
              <button
                onClick={() => router.push(`/messages?to=${username}`)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium border-2 border-gray-900 text-gray-900 bg-transparent hover:bg-gray-900 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                私信
              </button>
            </>
          )}
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

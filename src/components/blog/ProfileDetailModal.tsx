'use client';

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import TagBadge from "./TagBadge";

interface ProfileDetailModalProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDetailModal({ username, isOpen, onClose }: ProfileDetailModalProps) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && username) {
      Promise.all([
        fetch(`/api/profile/${username}`).then((r) => r.json()),
        fetch(`/api/users/${username}/followers`).then((r) => r.json()),
        fetch(`/api/users/${username}/following`).then((r) => r.json()),
      ]).then(([profile, followers, following]) => {
        setData({ profile, followers, following });
      });
    }
  }, [isOpen, username]);

  if (!data) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="个人信息">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {data.profile?.avatarUrl && (
            <img src={data.profile.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
          )}
          <div>
            <h3 className="text-lg font-semibold">{data.profile?.displayName || username}</h3>
            <p className="text-sm text-zinc-500">@{username}</p>
          </div>
        </div>

        {data.profile?.bio && (
          <p className="text-sm text-zinc-700">{data.profile.bio}</p>
        )}

        <div className="flex gap-4 text-sm text-zinc-600">
          <span><strong>{data.following?.count || 0}</strong> 正在关注</span>
          <span><strong>{data.followers?.count || 0}</strong> 关注者</span>
        </div>

        {data.profile?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.profile.tags.map((pt: { tag: { id: string; name: string } }) => (
              <TagBadge key={pt.tag.id} name={pt.tag.name} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

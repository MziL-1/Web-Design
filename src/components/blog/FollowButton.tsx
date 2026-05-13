'use client';

import { useState } from "react";

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
}

export default function FollowButton({ username, initialIsFollowing, isOwnProfile }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  if (isOwnProfile) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
        isFollowing
          ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
          : "border-2 border-primary text-primary hover:bg-primary/5"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? "..." : isFollowing ? "已关注" : "+ 关注"}
    </button>
  );
}

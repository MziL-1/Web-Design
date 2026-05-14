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
      className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? "bg-gray-50 text-gray-600 border border-gray-200"
          : "border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-600 hover:text-white"
      }`}
    >
      {loading ? "..." : isFollowing ? "已关注" : "关注"}
    </button>
  );
}

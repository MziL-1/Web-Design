"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import BlogPostCard from "@/components/blog/BlogPostCard";

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
  tags: Array<{ tag: { id: string; name: string } }>;
  isFollowing: boolean;
}

interface Props {
  sessionUsername: string | null;
  loggedIn: boolean;
  profiles: ProfileData[];
}

function stripMarkdown(text: string): string {
  return text.replace(/[#*`>\[\]()!\-_~=+|{}.]/g, "").replace(/\n+/g, " ").trim();
}

export default function HomePageClient({ sessionUsername, loggedIn, profiles }: Props) {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedFetched, setFeedFetched] = useState(false);

  useEffect(() => {
    if (activeTab === "following" && loggedIn && !feedFetched) {
      setFeedLoading(true);
      fetch("/api/feed")
        .then((r) => r.json())
        .then((data) => { setFeedPosts(data.posts || []); setFeedFetched(true); })
        .finally(() => setFeedLoading(false));
    }
  }, [activeTab, loggedIn, feedFetched]);

  const actionHref = sessionUsername ? `/${sessionUsername}` : "/register";
  const actionLabel = sessionUsername ? "开始写博客" : "成为第一个";

  return (
    <div>
      {loggedIn && (
        <div className="flex gap-8 mb-8 border-b border-gray-200 relative">
          <button
            onClick={() => setActiveTab("discover")}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              activeTab === "discover" ? "text-gray-950" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            发现博客
            {activeTab === "discover" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 transition-all duration-300" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              activeTab === "following" ? "text-gray-950" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            我的关注
            {activeTab === "following" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 transition-all duration-300" />
            )}
          </button>
        </div>
      )}

      {activeTab === "discover" ? (
        profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20">
            <p className="text-lg text-gray-400">还没有人发布博客</p>
            <Link href={actionHref} className="mt-4 rounded-lg bg-gray-950 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-600 transition-colors">
              {actionLabel}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/${p.username}`}
                className="group cursor-pointer pb-12 border-b border-gray-200 last:border-b-0"
              >
                <BlogPostCard
                  title={p.displayName}
                  description={p.bio ?? undefined}
                  authorAvatar={p.avatarUrl ?? undefined}
                  stats={[{ label: "篇文章", value: String(p.postCount) }]}
                  tags={p.tags}
                  isFollowing={p.isFollowing}
                />
              </Link>
            ))}
          </div>
        )
      ) : feedLoading ? (
        <div className="flex flex-col gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : feedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20">
          <p className="text-lg text-gray-400">还没有关注任何人</p>
          <button
            onClick={() => setActiveTab("discover")}
            className="mt-4 rounded-lg bg-gray-950 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
          >
            去发现博客
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {feedPosts.map((item: any) => (
            <Link
              key={item.id}
              href={`/${item.user.username}/${item.id}`}
              className="group cursor-pointer pb-12 border-b border-gray-200 last:border-b-0"
            >
              <BlogPostCard
                title={item.title}
                description={item.content ? stripMarkdown(item.content).slice(0, 160) : undefined}
                authorName={item.user.profile?.displayName || item.user.username}
                authorAvatar={item.user.profile?.avatarUrl ?? undefined}
                date={new Date(item.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                stats={[{ label: "点赞", value: String(item._count?.likes || 0) }]}
                tags={item.tags}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

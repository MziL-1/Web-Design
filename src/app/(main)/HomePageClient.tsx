"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import TabNav from "@/components/nav/TabNav";
import SearchBar from "@/components/search/SearchBar";
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

export default function HomePageClient({ sessionUsername, loggedIn, profiles }: Props) {
  const activeTab = useAppStore((s) => s.activeTab);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">发现博客</h1>
          <p className="mt-2 text-neutral-muted">浏览最新发布的个人博客</p>
        </div>
        <SearchBar />
      </div>

      <TabNav />

      {activeTab === "discover" ? (
        profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-20">
            <p className="text-lg text-neutral-muted">还没有人发布博客</p>
            <Link href={actionHref} className="mt-4 rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90">
              {actionLabel}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <Link key={p.id} href={`/${p.username}`}>
                <BlogPostCard
                  title={p.displayName}
                  description={p.bio ?? undefined}
                  avatarUrl={p.avatarUrl ?? undefined}
                  postCount={p.postCount}
                  tags={p.tags}
                  isFollowing={p.isFollowing}
                />
              </Link>
            ))}
          </div>
        )
      ) : feedLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-zinc-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : feedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-20">
          <p className="text-lg text-neutral-muted">还没有关注任何人</p>
          <button
            onClick={() => useAppStore.getState().setActiveTab("discover")}
            className="mt-4 rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90"
          >
            去发现博客
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {feedPosts.map((item: any) => (
            <Link key={item.id} href={`/${item.user.username}/${item.id}`}>
              <BlogPostCard
                title={item.title}
                description={`@${item.user.username}`}
                avatarUrl={item.user.profile?.avatarUrl ?? undefined}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

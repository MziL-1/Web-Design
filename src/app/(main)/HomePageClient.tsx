"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import BlogPostCard from "@/components/blog/BlogPostCard";
import TagBadge from "@/components/blog/TagBadge";

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
  const router = useRouter();
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <article
              key={item.id}
              className="pb-12 border-b border-gray-200 last:border-b-0 cursor-pointer"
              onClick={() => router.push(`/${item.user.username}/${item.id}`)}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                    {item.user.profile?.avatarUrl ? (
                      <img src={item.user.profile.avatarUrl} alt={item.user.username} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">{item.user.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <Link
                    href={`/${item.user.username}`}
                    className="text-sm font-medium text-gray-950 hover:text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.user.profile?.displayName || item.user.username}
                  </Link>
                  <span className="text-sm text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>

                <h2 className="font-display text-[22px] font-medium leading-tight text-gray-950 hover:text-blue-600 transition-colors mb-3">
                  {item.title}
                </h2>

                {item.content && (
                  <p className="text-[15px] leading-relaxed text-gray-600 mb-4 line-clamp-2">
                    {stripMarkdown(item.content).slice(0, 160)}
                  </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.tags.slice(0, 3).map((pt: any) => (
                        <TagBadge key={pt.tag.id} name={pt.tag.name} />
                      ))}
                    </div>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {item._count?.likes || 0} 点赞
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

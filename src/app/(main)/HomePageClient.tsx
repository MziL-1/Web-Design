"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import BlogPostCard from "@/components/blog/BlogPostCard";

interface DiscoverPost {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  createdAt: string;
  _count: { comments: number; likes: number };
  user: { username: string; profile: { displayName: string; avatarUrl: string | null } | null };
  tags: Array<{ tag: { id: string; name: string } }>;
}

interface FollowingProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
  tags: Array<{ tag: { id: string; name: string } }>;
}

interface Props {
  sessionUsername: string | null;
  loggedIn: boolean;
  discoverPosts: DiscoverPost[];
  followingProfiles: FollowingProfile[];
}

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/[#*`>\[\]()!\-_~=+|{}.]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export default function HomePageClient({ sessionUsername, loggedIn, discoverPosts, followingProfiles }: Props) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const searchQuery = urlSearchParams.get("q");
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const [searchResults, setSearchResults] = useState<{ users: any[]; posts: any[]; tags: any[] } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      setSearchLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((data) => setSearchResults(data))
        .finally(() => setSearchLoading(false));
    } else {
      setSearchResults(null);
    }
  }, [searchQuery]);

  const actionHref = sessionUsername ? `/${sessionUsername}` : "/register";
  const actionLabel = sessionUsername ? "开始写博客" : "成为第一个";

  if (searchQuery) {
    return (
      <div>
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-950 transition-colors">
            &larr; 返回首页
          </Link>
          <p className="mt-2 text-lg text-gray-950">
            搜索：<span className="font-medium">"{searchQuery}"</span>
          </p>
        </div>

        {searchLoading ? (
          <div className="flex flex-col gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : !searchResults ? null : (
          <>
            {searchResults.users.length === 0 && searchResults.posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20">
                <p className="text-lg text-gray-400">没有找到相关内容</p>
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {searchResults.users.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 pb-2 border-b border-gray-200">
                      用户
                    </h3>
                    <div className="flex flex-col gap-3">
                      {searchResults.users.map((u: any) => (
                        <Link
                          key={u.id}
                          href={`/${u.username}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">{u.username[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-gray-950">{u.displayName}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.posts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 pb-2 border-b border-gray-200">
                      文章
                    </h3>
                    <div className="flex flex-col gap-12">
                      {searchResults.posts.map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/${item.user?.username || ''}/${item.id}`}
                          className="group cursor-pointer pb-12 border-b border-gray-200 last:border-b-0"
                        >
                          <BlogPostCard
                            title={item.title}
                            description={item.content ? stripMarkdown(item.content).slice(0, 160) : undefined}
                            authorName={item.user?.profile?.displayName || item.user?.username}
                            authorAvatar={item.user?.profile?.avatarUrl}
                            imageUrl={item.coverImage}
                            date={new Date(item.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                            tags={item.tags}
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

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
        discoverPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20">
            <p className="text-lg text-gray-400">还没有人发布文章</p>
            <Link href={actionHref} className="mt-4 rounded-lg bg-gray-950 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-600 transition-colors">
              {actionLabel}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {discoverPosts.map((item) => (
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
                  imageUrl={item.coverImage ?? undefined}
                  date={new Date(item.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  stats={[{ label: "点赞", value: String(item._count.likes) }, { label: "条评论", value: String(item._count.comments) }]}
                  tags={item.tags}
                />
              </Link>
            ))}
          </div>
        )
      ) : followingProfiles.length === 0 ? (
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
          {followingProfiles.map((fp) => (
            <Link
              key={fp.id}
              href={`/${fp.username}`}
              className="group cursor-pointer pb-12 border-b border-gray-200 last:border-b-0"
            >
              <BlogPostCard
                title=""
                description={fp.bio ?? undefined}
                authorName={fp.displayName}
                authorAvatar={fp.avatarUrl ?? undefined}
                stats={[{ label: "篇文章", value: String(fp.postCount) }]}
                tags={fp.tags}
                isFollowing={true}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

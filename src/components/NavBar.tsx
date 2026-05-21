"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

const CreatePostModal = dynamic(() => import("@/components/modals/CreatePostModal"), {
  ssr: false,
});

interface NavBarProps {
  session: {
    user: { id: string; username: string; email?: string | null; avatarUrl?: string | null };
  } | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function NavBar({ session }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const isHome = pathname === "/";

  const [searchValue, setSearchValue] = useState(urlSearchParams.get("q") ?? "");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{ users: any[]; posts: any[] }>({ users: [], posts: [] });
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchValue.trim(), 300);

  useEffect(() => {
    if (debouncedSearch.length < 1) {
      setSearchResults({ users: [], posts: [] });
      return;
    }
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setSearchResults({
          users: data.users?.slice(0, 3) ?? [],
          posts: data.posts?.slice(0, 3) ?? [],
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [debouncedSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = () => {
    if (!confirm("确定要退出登录吗？")) return;
    signOut({ redirect: false }).then(() => {
      router.push("/");
      router.refresh();
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      setShowDropdown(false);
      router.push(`/?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleWriteClick = () => {
    if (session) {
      setShowCreateModal(true);
    } else {
      router.push("/login");
    }
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    router.refresh();
  };

  const hasResults = searchResults.users.length > 0 || searchResults.posts.length > 0;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-50/95 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="font-display text-2xl font-semibold tracking-[-0.5px] text-gray-950 no-underline">
            BlogPlatform
          </Link>

          {isHome && (
            <div ref={searchRef} className="flex-1 mx-8 max-w-[400px] relative">
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); setShowDropdown(true); }}
                onFocus={() => { if (searchValue.trim()) setShowDropdown(true); }}
                onKeyDown={handleSearchKeyDown}
                placeholder="搜索作者、标签、文章..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              />

              {showDropdown && hasResults && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {searchResults.users.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">
                        用户
                      </div>
                      {searchResults.users.map((u: any) => (
                        <Link
                          key={u.id}
                          href={`/${u.username}`}
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium text-gray-600">{u.username[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-950 block truncate">{u.displayName}</span>
                            <span className="text-xs text-gray-400">@{u.username}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.posts.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">
                        文章
                      </div>
                      {searchResults.posts.map((p: any) => (
                        <Link
                          key={p.id}
                          href={`/${p.user?.username || ''}/${p.id}`}
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-950 block truncate">{p.title}</span>
                          <span className="text-xs text-gray-400">{p.user?.profile?.displayName || p.user?.username} · {new Date(p.createdAt).toLocaleDateString("zh-CN")}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Link
              href="/templates"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith("/templates") ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              模板
            </Link>

            <button
              onClick={handleWriteClick}
              className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              写文章
            </button>

            {session ? (
              <>
                <Link
                  href="/dashboard/deploy"
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith("/dashboard/deploy") ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  部署
                </Link>

                <Link
                href="/messages"
                className="text-gray-600 hover:text-gray-950 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </Link>

                <Link
                  href={`/${session.user.username}`}
                  className="w-9 h-9 rounded-full border-2 border-transparent hover:border-blue-600 transition-colors overflow-hidden flex items-center justify-center bg-blue-600"
                >
                  {session.user.avatarUrl ? (
                    <img src={session.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {session.user.username[0].toUpperCase()}
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-950">
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePostCreated}
      />
    </>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ users: any[]; posts: any[] }>({ users: [], posts: [] });
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

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

  const NavLink = ({ href, label, active }: { href: string; label: string; active?: boolean }) => (
    <Link
      href={href}
      className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors ${
        active
          ? "bg-gray-100 text-gray-950"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
      }`}
    >
      {label}
    </Link>
  );

  const mobileNavItems = (
    <div className="flex flex-col gap-1 px-2">
      <NavLink href="/templates" label="模板" active={pathname.startsWith("/templates")} />
      <NavLink href="/" label="发现博客" active={pathname === "/"} />
      {session && (
        <>
          <NavLink href="/dashboard/deploy" label="部署" active={pathname.startsWith("/dashboard/deploy")} />
          <NavLink href="/messages" label="消息" active={pathname.startsWith("/messages")} />
          <NavLink href={`/${session.user.username}`} label="我的博客" active={pathname === `/${session.user.username}`} />
        </>
      )}
      <div className="border-t border-gray-100 my-2" />
      <button
        onClick={handleWriteClick}
        className="flex items-center justify-center gap-2 mx-2 px-4 py-3 rounded-lg bg-gray-950 text-white text-base font-medium hover:bg-gray-800 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        写文章
      </button>
      {session ? (
        <button
          onClick={handleSignOut}
          className="mx-2 mt-1 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          退出登录
        </button>
      ) : (
        <div className="flex flex-col gap-2 mt-2 px-2">
          <Link
            href="/login"
            className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="px-4 py-3 text-center rounded-lg bg-gray-950 text-white text-base font-medium hover:bg-gray-800 transition-colors"
          >
            注册
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-50/95 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 sm:px-6">
          <Link href="/" className="font-display text-2xl font-semibold tracking-[-0.5px] text-gray-950 no-underline shrink-0">
            BlogPlatform
          </Link>

          {isHome && (
            <div ref={searchRef} className="flex-1 mx-2 sm:mx-8 max-w-[400px] relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); setShowDropdown(true); }}
                onFocus={() => { if (searchValue.trim()) setShowDropdown(true); }}
                onKeyDown={handleSearchKeyDown}
                placeholder="搜索作者、标签、文章..."
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
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

          {/* Desktop nav items */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile: avatar / login + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {session ? (
              <Link
                href={`/${session.user.username}`}
                className="w-8 h-8 rounded-full border-2 border-transparent hover:border-blue-600 transition-colors overflow-hidden flex items-center justify-center bg-blue-600 shrink-0"
              >
                {session.user.avatarUrl ? (
                  <img src={session.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-medium text-white">
                    {session.user.username[0].toUpperCase()}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-gray-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-600 transition-colors shrink-0"
              >
                登录
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 text-gray-600 hover:text-gray-950 transition-colors -mr-1"
              aria-label="打开菜单"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="4" y1="12" x2="20" y2="12"/>
                <line x1="4" y1="18" x2="20" y2="18"/>
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div
            ref={mobileRef}
            className="absolute right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-2xl animate-slide-in-right overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
              <span className="font-display text-lg font-semibold text-gray-950">菜单</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="关闭菜单"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="py-4">
              {mobileNavItems}
            </div>
          </div>
        </div>
      )}

      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePostCreated}
      />
    </>
  );
}

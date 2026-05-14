"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import CreatePostModal from "@/components/modals/CreatePostModal";

interface NavBarProps {
  session: {
    user: { id: string; username: string; email?: string | null };
  } | null;
}

export default function NavBar({ session }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const isHome = pathname === "/";

  const [searchValue, setSearchValue] = useState(urlSearchParams.get("q") ?? "");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSignOut = () => {
    if (!confirm("确定要退出登录吗？")) return;
    signOut({ redirect: false }).then(() => {
      router.push("/");
      router.refresh();
    });
  };

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      router.push(`/?q=${encodeURIComponent(searchValue.trim())}`);
    }
  }, [router, searchValue]);

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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-50/95 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="font-display text-2xl font-semibold tracking-[-0.5px] text-gray-950 no-underline">
            BlogPlatform
          </Link>

          {isHome && (
            <div className="flex-1 mx-8 max-w-[400px]">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="搜索作者、标签、文章..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
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
                <svg className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-950 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>

                <Link
                  href={`/${session.user.username}`}
                  className="w-9 h-9 rounded-full border-2 border-transparent hover:border-blue-600 transition-colors overflow-hidden flex items-center justify-center bg-blue-600"
                >
                  <span className="text-sm font-medium text-white">
                    {session.user.username[0].toUpperCase()}
                  </span>
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

"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import SearchBar from "@/components/search/SearchBar";

interface NavBarProps {
  session: {
    user: { id: string; username: string; email?: string | null };
  } | null;
}

export default function NavBar({ session }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const handleSignOut = () => {
    if (!confirm("确定要退出登录吗？")) return;
    signOut({ redirect: false }).then(() => {
      router.push("/");
      router.refresh();
    });
  };

  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold text-gray-900">
            BlogPlatform
          </Link>
          {session && isHome && (
            <div className="relative flex gap-6">
              <button
                onClick={() => setActiveTab("discover")}
                className={`relative pb-4 pt-4 text-sm font-medium transition-colors ${
                  activeTab === "discover" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                发现
                {activeTab === "discover" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className={`relative pb-4 pt-4 text-sm font-medium transition-colors ${
                  activeTab === "following" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                关注
                {activeTab === "following" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showSearch ? (
            <div className="relative">
              <SearchBar />
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="搜索"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          {session ? (
            <>
              <Link
                href={`/${session.user.username}`}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {session.user.username[0].toUpperCase()}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

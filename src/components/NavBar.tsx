"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavBarProps {
  session: {
    user: { id: string; username: string; email?: string | null };
  } | null;
}

export default function NavBar({ session }: NavBarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-primary">
          Blog Platform
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                href={`/${session.user.username}`}
                className="text-sm text-neutral hover:text-primary"
              >
                {session.user.username}
              </Link>
              <Link
                href="/api/auth/signout"
                className="text-sm text-neutral-muted hover:text-neutral"
              >
                退出
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-neutral-muted hover:text-neutral"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
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

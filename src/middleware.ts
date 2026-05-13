import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

const protectedPaths = ["/api/profile", "/api/posts", "/api/my-posts", "/api/upload", "/api/users", "/api/import", "/api/feed"];
const needsAuth = (path: string) => {
  if (path.includes("/comments")) return false;
  return protectedPaths.some((p) => path.startsWith(p));
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (req.method !== "GET" && needsAuth(pathname) && !req.auth) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/api/profile/:path*", "/api/posts/:path*", "/api/my-posts", "/api/upload", "/api/users/:path*", "/api/import/:path*", "/api/feed/:path*"],
};

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      username: (form.get("username") as string).toLowerCase(),
      email: form.get("email") as string,
      password: form.get("password") as string,
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push(`/login?registered=true`);
    } else {
      const data = await res.json();
      setError(data.error ?? "注册失败");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <Link
        href="/"
        className="absolute left-6 top-6 font-display text-2xl font-semibold tracking-[-0.5px] text-gray-950 hover:text-blue-600 transition-colors"
      >
        BlogPlatform
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-950">创建账号</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_-]+"
              placeholder="your-name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-400">
              3-30个小写字母、数字、下划线或连字符
            </p>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-gray-950 font-medium text-white hover:bg-gray-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          已有账号？{" "}
          <Link href="/login" className="text-blue-600 hover:underline">登录</Link>
        </p>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { sendVerificationCode } from "@/lib/verification";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const body = await request.json();
  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "请输入邮箱" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const ok = await checkRateLimit(ip, "register");
  if (!ok) return NextResponse.json({ error: "操作太频繁，请稍后再试" }, { status: 429 });

  const result = await sendVerificationCode(email);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    ...(result.code ? { code: result.code } : {}),
  });
}

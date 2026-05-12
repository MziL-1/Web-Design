import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  validateUsername,
  validateEmail,
  validatePassword,
} from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    const err =
      validateUsername(username) ||
      validateEmail(email) ||
      validatePassword(password);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const ok = await checkRateLimit(ip, "register");
    if (!ok) return NextResponse.json({ error: "注册太频繁，请稍后再试" }, { status: 429 });

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.username === username ? "用户名已存在" : "邮箱已注册" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        username,
        email,
        password: hashed,
        profile: { create: { displayName: username } },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("register error:", e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

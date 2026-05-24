import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const count = await prisma.message.count({
    where: {
      receiverId: session.user.id,
      read: false,
    },
  });

  return NextResponse.json({ count });
}

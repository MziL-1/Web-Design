import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("with");

  if (withUserId !== null) {
    const trimmed = withUserId.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: trimmed },
          { senderId: trimmed, receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    await prisma.message.updateMany({
      where: {
        receiverId: session.user.id,
        senderId: trimmed,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json(messages);
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      receiver: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
    },
  });

  const conversationsMap = new Map<string, typeof messages[0]>();
  for (const msg of messages) {
    const otherUserId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, msg);
    }
  }

  const unreadCounts = await prisma.message.groupBy({
    by: ["senderId"],
    where: {
      receiverId: session.user.id,
      read: false,
    },
    _count: { id: true },
  });

  const unreadMap = new Map(unreadCounts.map((u) => [u.senderId, u._count.id]));

  const conversations = Array.from(conversationsMap.values()).map((msg) => {
    const otherUser = msg.senderId === session.user.id ? msg.receiver : msg.sender;
    return {
      id: otherUser.username,
      user: {
        username: otherUser.username,
        displayName: otherUser.profile?.displayName || otherUser.username,
        avatar: otherUser.profile?.avatarUrl || "",
      },
      lastMessage: msg.content.slice(0, 60),
      time: msg.createdAt.toISOString(),
      unread: unreadMap.get(otherUser.username === msg.sender?.username ? msg.senderId : msg.receiverId) || 0,
    };
  });

  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: { receiverId?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const { receiverId, content } = body;

  if (!receiverId || typeof receiverId !== "string") {
    return NextResponse.json({ error: "缺少接收者ID" }, { status: 400 });
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "消息内容不能为空" }, { status: 400 });
  }

  if (receiverId === session.user.id) {
    return NextResponse.json({ error: "不能给自己发消息" }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  if (!receiver) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
    },
    include: {
      sender: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      receiver: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}

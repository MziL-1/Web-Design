import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateField } from "@/lib/validation";
import { checkRateLimit, checkCommentDuplicate } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  const body = await request.json();

  if (body.website && body.website !== "") {
    return NextResponse.json({ success: true });
  }

  const nameErr = validateField(body.authorName, "昵称", 1, 30);
  if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });

  const contentErr = validateField(body.content, "评论内容", 1, 2000);
  if (contentErr) return NextResponse.json({ error: contentErr }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  const ok = await checkRateLimit(ip, "comment");
  if (!ok) return NextResponse.json({ error: "评论太频繁，请稍后再试" }, { status: 429 });

  const duplicate = await checkCommentDuplicate(ip, postId, body.content);
  if (duplicate) return NextResponse.json({ success: true });

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorName: body.authorName,
      content: body.content,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

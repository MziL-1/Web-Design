"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  isOwner: boolean;
}

export default function CommentSection({
  postId,
  initialComments,
  isOwner,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    setSubmitting(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorName: authorName.trim(),
        content: content.trim(),
        website: "",
      }),
    });

    if (res.ok) {
      const newComment = await res.json();
      if (newComment.id) {
        setComments((prev) => [newComment, ...prev]);
      }
      setAuthorName("");
      setContent("");
      toast("评论已发布");
    } else {
      const data = await res.json();
      toast(data.error ?? "评论失败", "error");
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast("评论已删除");
    }
  };

  return (
    <div className="mt-12 border-t border-slate-200 pt-8">
      <h3 className="mb-6 text-xl font-semibold">评论 ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: "none" }}
        />
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="你的昵称"
          maxLength={30}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          maxLength={2000}
          required
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <Button type="submit" loading={submitting} disabled={!authorName.trim() || !content.trim()}>
          发表评论
        </Button>
      </form>

      {comments.length === 0 ? (
        <EmptyState message="暂无评论，来说点什么吧" />
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{comment.authorName}</span>
                  <span className="ml-2 text-sm text-neutral-muted">
                    {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                {isOwner && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                  >
                    删除
                  </Button>
                )}
              </div>
              <p className="mt-2 text-neutral">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

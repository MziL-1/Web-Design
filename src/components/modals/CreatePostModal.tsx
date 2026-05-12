"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (post: { id: string; title: string; content: string; createdAt: string; _count: { comments: number } }) => void;
}

export default function CreatePostModal({ open, onClose, onCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content, published: true }),
    });

    if (res.ok) {
      const post = await res.json();
      toast("文章已发布");
      setTitle("");
      setContent("");
      onCreated({ id: post.id, title: post.title, content: post.content, createdAt: post.createdAt, _count: { comments: 0 } });
      onClose();
    } else {
      const data = await res.json();
      toast(data.error ?? "发布失败", "error");
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="写文章">
      <div className="space-y-4">
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            maxLength={200}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-lg font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写点什么... (支持 Markdown)"
            maxLength={50000}
            rows={10}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-neutral-muted">支持 Markdown 语法 · {content.length}/50000</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} loading={saving} disabled={!title.trim()}>发布文章</Button>
        </div>
      </div>
    </Modal>
  );
}

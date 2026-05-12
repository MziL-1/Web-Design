"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface EditPostModalProps {
  open: boolean;
  onClose: () => void;
  post: { id: string; title: string; content: string; published: boolean };
  onSaved: () => void;
}

export default function EditPostModal({ open, onClose, post, onSaved }: EditPostModalProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [published, setPublished] = useState(post.published);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content, published }),
    });

    if (res.ok) {
      toast("文章已更新");
      onSaved();
      onClose();
    } else {
      const data = await res.json();
      toast(data.error ?? "保存失败", "error");
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑文章">
      <div className="space-y-4">
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-lg font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published-toggle"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <label htmlFor="published-toggle" className="text-sm text-neutral-muted">对外可见</label>
        </div>

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={50000}
            rows={10}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-neutral-muted">{content.length}/50000</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} loading={saving} disabled={!title.trim()}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}

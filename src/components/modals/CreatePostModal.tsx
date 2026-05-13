"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import FileImportDropzone from "@/components/editor/FileImportDropzone";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (post: { id: string; title: string; content: string; createdAt: string; _count: { comments: number; likes: number } }) => void;
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
      onCreated({ id: post.id, title: post.title, content: post.content, createdAt: post.createdAt, _count: { comments: 0, likes: 0 } });
      onClose();
    } else {
      const data = await res.json();
      toast(data.error ?? "发布失败", "error");
    }
    setSaving(false);
  };

  const handleFileParsed = (importedContent: string, filename: string, warnings: string[]) => {
    setContent(importedContent);
    const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
    if (!title) setTitle(nameWithoutExt);
    if (warnings.length > 0) {
      toast(`文件已导入，但存在 ${warnings.length} 条警告，请检查内容`, "error");
    } else {
      toast("文件导入成功");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="写文章" size="wide">
      <div className="flex flex-col max-h-[70vh]">
        <div className="overflow-y-auto px-1 space-y-4">
          <FileImportDropzone onFileParsed={handleFileParsed} />

          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              maxLength={200}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-lg font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="min-h-[300px]">
            <MarkdownEditor
              initialValue={content}
              onChange={setContent}
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 bg-white">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} loading={saving} disabled={!title.trim()}>发布文章</Button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const MarkdownEditor = dynamic(() => import("@/components/editor/MarkdownEditor"), {
  loading: () => <div className="h-[300px] bg-gray-50 animate-pulse rounded-lg" />,
});

interface EditPostModalProps {
  open: boolean;
  onClose: () => void;
  post: { id: string; title: string; content: string; coverImage?: string | null; published: boolean };
  onSaved: () => void;
}

export default function EditPostModal({ open, onClose, post, onSaved }: EditPostModalProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [coverImage, setCoverImage] = useState<string | null>(post.coverImage ?? null);
  const [published, setPublished] = useState(post.published);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("请选择图片文件", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("图片不能超过5MB", "error");
      return;
    }

    setUploadingCover(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setCoverImage(data.url);
        toast("封面上传成功");
      } else {
        const data = await res.json();
        toast(data.error ?? "上传失败", "error");
      }
    } catch {
      toast("上传失败", "error");
    }
    setUploadingCover(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content, coverImage, published }),
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
    <Modal open={open} onClose={onClose} title="编辑文章" size="wide">
      <div className="flex flex-col max-h-[70vh]">
        <div className="overflow-y-auto px-1 space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">封面图（选填，不填则取正文第一张图）</label>
            <div className="flex items-center gap-3">
              {coverImage ? (
                <div className="relative group">
                  <img src={coverImage} alt="封面" className="h-20 w-32 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => setCoverImage(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-32 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                </div>
              )}
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  {uploadingCover ? "上传中..." : coverImage ? "更换图片" : "上传图片"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
                <p className="mt-1 text-xs text-gray-400">JPG/PNG/WebP，最大 5MB</p>
              </div>
            </div>
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
          <Button onClick={handleSave} loading={saving} disabled={!title.trim()}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}

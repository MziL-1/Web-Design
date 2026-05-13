"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import TagSelector from "@/components/blog/TagSelector";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  initialName: string;
  initialBio: string;
  initialAvatarUrl: string | null;
  initialTagIds?: string[];
  onSaved: () => void;
}

export default function EditProfileModal({
  open,
  onClose,
  initialName,
  initialBio,
  initialAvatarUrl,
  initialTagIds = [],
  onSaved,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (res.ok) {
      const data = await res.json();
      setAvatarUrl(data.url);
      toast("头像上传成功");
    } else {
      const data = await res.json();
      toast(data.error ?? "上传失败", "error");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        avatarUrl: avatarUrl || null,
        tagIds,
      }),
    });
    if (res.ok) {
      toast("个人信息已更新");
      onSaved();
      onClose();
    } else {
      const data = await res.json();
      toast(data.error ?? "保存失败", "error");
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑个人信息">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">头像</label>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary-light">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl text-primary">{displayName[0]}</span>
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
              {uploading ? "上传中..." : "选择图片"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          <p className="mt-1 text-xs text-neutral-muted">支持 jpg/png/webp/gif/avif，最大 5MB</p>
        </div>

        <div>
          <label htmlFor="display-name" className="mb-1 block text-sm font-medium">显示名称</label>
          <input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium">个人简介 (最多 50 字)</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={50}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-neutral-muted">{bio.length}/50</p>
        </div>

        <TagSelector selectedTagIds={tagIds} onChange={setTagIds} />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} loading={saving} disabled={!displayName.trim()}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}

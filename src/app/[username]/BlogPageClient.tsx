"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogPostList from "@/components/blog/BlogPostList";
import EditProfileModal from "@/components/modals/EditProfileModal";
import CreatePostModal from "@/components/modals/CreatePostModal";
import EditPostModal from "@/components/modals/EditPostModal";
import type { PostItem, PostEditData } from "@/lib/types";

interface Props {
  username: string;
  profile: {
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    sitePublished: boolean;
  };
  posts: PostItem[];
  isOwner: boolean;
}

function BlogPageClientInner({ username, profile, posts: initialPosts, isOwner }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState(initialPosts);
  const [sitePublished, setSitePublished] = useState(profile.sitePublished);
  const [toggling, setToggling] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<PostEditData | null>(null);

  const handleTogglePublished = async () => {
    setToggling(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sitePublished: !sitePublished }),
    });
    if (res.ok) {
      setSitePublished((prev) => !prev);
    } else {
      toast("操作失败，请重试", "error");
    }
    setToggling(false);
  };

  const handleDeletePost = async (post: PostItem) => {
    if (!confirm(`确定删除"${post.title}"？此操作不可撤销。`)) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast("文章已删除");
    } else {
      toast("删除失败", "error");
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <BlogHeader
        displayName={profile.displayName}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
        isOwner={isOwner}
        sitePublished={sitePublished}
        onEditProfile={() => setShowProfileModal(true)}
        onTogglePublished={handleTogglePublished}
        toggling={toggling}
      />

      <BlogPostList
        posts={posts}
        isOwner={isOwner}
        username={username}
        onNewPost={() => setShowCreateModal(true)}
        onEditPost={(post) => setEditingPost({ id: post.id, title: post.title, content: post.content ?? "", published: post.published })}
        onDeletePost={handleDeletePost}
      />

      <EditProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        initialName={profile.displayName}
        initialBio={profile.bio ?? ""}
        initialAvatarUrl={profile.avatarUrl}
        onSaved={handleRefresh}
      />

      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleRefresh}
      />

      {editingPost && (
        <EditPostModal
          open={!!editingPost}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          onSaved={handleRefresh}
        />
      )}
    </div>
  );
}

export default function BlogPageClient(props: Props) {
  return (
    <ToastProvider>
      <BlogPageClientInner {...props} />
    </ToastProvider>
  );
}

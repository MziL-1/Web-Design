"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";
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

export default function BlogPageClient({ username, profile, posts: initialPosts, isOwner }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [sitePublished, setSitePublished] = useState(profile.sitePublished);
  const [toggling, setToggling] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<PostEditData | null>(null);

  const handleTogglePublished = async () => {
    setToggling(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sitePublished: !sitePublished }),
    });
    setSitePublished(!sitePublished);
    setToggling(false);
  };

  const handleDeletePost = async (post: PostItem) => {
    if (!confirm(`确定删除"${post.title}"？此操作不可撤销。`)) return;
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <ToastProvider>
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
      </div>

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
    </ToastProvider>
  );
}

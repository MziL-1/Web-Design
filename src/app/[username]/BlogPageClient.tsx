"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogPostList from "@/components/blog/BlogPostList";
import type { PostItem, PostEditData } from "@/lib/types";

const EditProfileModal = dynamic(() => import("@/components/modals/EditProfileModal"), { ssr: false });
const CreatePostModal = dynamic(() => import("@/components/modals/CreatePostModal"), { ssr: false });
const EditPostModal = dynamic(() => import("@/components/modals/EditPostModal"), { ssr: false });

interface Props {
  username: string;
  profile: {
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    sitePublished: boolean;
    tags: Array<{ tag: { id: string; name: string } }>;
  };
  posts: PostItem[];
  isOwner: boolean;
  isFollowing: boolean;
}

function BlogPageClientInner({ username, profile, posts: initialPosts, isOwner, isFollowing }: Props) {
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

  const handlePostUpdated = async () => {
    router.refresh();
    if (!editingPost) return;
    const res = await fetch(`/api/posts/${editingPost.id}`);
    if (res.ok) {
      const updated = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === updated.id ? { ...updated, _count: p._count } : p
        )
      );
    }
  };

  const handlePostCreated = (post: { id: string; title: string; content: string; coverImage?: string | null; createdAt: string; _count: { comments: number; likes: number } }) => {
    setPosts((prev) => [{ ...post, published: true }, ...prev]);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-[800px]">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-950 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        发现更多博客
      </Link>
      <BlogHeader
        username={username}
        displayName={profile.displayName}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
        isOwner={isOwner}
        sitePublished={sitePublished}
        onEditProfile={() => setShowProfileModal(true)}
        onTogglePublished={handleTogglePublished}
        toggling={toggling}
        tags={profile.tags}
        isFollowing={isFollowing}
      />

      <BlogPostList
        posts={posts}
        isOwner={isOwner}
        username={username}
        onNewPost={() => setShowCreateModal(true)}
        onEditPost={(post) => setEditingPost({ id: post.id, title: post.title, content: post.content ?? "", coverImage: post.coverImage, published: post.published })}
        onDeletePost={handleDeletePost}
      />

      <EditProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        initialName={profile.displayName}
        initialBio={profile.bio ?? ""}
        initialAvatarUrl={profile.avatarUrl}
        initialTagIds={profile.tags.map((pt) => pt.tag.id)}
        onSaved={handleRefresh}
      />

      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePostCreated}
      />

      {editingPost && (
        <EditPostModal
          open={!!editingPost}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          onSaved={handlePostUpdated}
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

export interface PostItem {
  id: string;
  title: string;
  content?: string;
  coverImage?: string | null;
  published: boolean;
  createdAt: string;
  _count: { comments: number; likes: number };
  tags?: { tag: { id: string; name: string } }[];
}

export interface PostEditData {
  id: string;
  title: string;
  content: string;
  coverImage?: string | null;
  published: boolean;
}

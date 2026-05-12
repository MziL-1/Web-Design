export interface PostItem {
  id: string;
  title: string;
  content?: string;
  published: boolean;
  createdAt: string;
  _count: { comments: number };
}

export interface PostEditData {
  id: string;
  title: string;
  content: string;
  published: boolean;
}

# Blog Platform V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade V1 blog platform with WYSIWYG editor (Milkdown), file import (md/docx/doc), follow system, tag system, search, likes, and enhanced discover page.

**Architecture:** Incremental expansion on V1 Next.js 15 App Router codebase. Data model grows from 5 to 9 Prisma tables. New service layer (import.ts, tags.ts, search.ts). zustand for UI-only state (Tab selection, search query). Milkdown replaces textarea for post editing. All APIs follow V1 error code conventions (400/401/403/404/409/429/500).

**Tech Stack:** Next.js 15.1, React 19, TypeScript 5.7, Tailwind CSS 4, Prisma 6 (SQLite), NextAuth v5, Milkdown, mammoth, zustand, Vitest, Playwright

**Design Doc:** `~/.gstack/projects/blog-platform/mzl-main-design-20260513-102634.md`

---

## File Structure

### New Files (ordered by stage)

```
src/app/api/import/route.ts                    # POST: file parse endpoint
src/app/api/search/route.ts                    # GET: multi-target search
src/app/api/tags/route.ts                      # GET: tag list / POST: create tag
src/app/api/users/[username]/follow/route.ts   # POST: toggle follow
src/app/api/users/[username]/followers/route.ts # GET: follower list
src/app/api/users/[username]/following/route.ts # GET: following list
src/app/api/users/[username]/likes/route.ts    # GET: liked posts
src/app/api/posts/[id]/like/route.ts           # POST: toggle like
src/app/api/feed/route.ts                      # GET: following feed
src/lib/import.ts                              # File parser service
src/lib/tags.ts                                # Tag presets + CRUD helpers
src/lib/search.ts                              # Search query builder
src/lib/store.ts                               # zustand UI store
src/components/editor/MarkdownEditor.tsx        # Milkdown WYSIWYG wrapper
src/components/editor/FileImportDropzone.tsx    # Drag-drop file import
src/components/blog/FollowButton.tsx            # Follow/unfollow toggle
src/components/blog/LikeButton.tsx              # Like/unlike toggle
src/components/blog/TagBadge.tsx                # Tag chip display
src/components/blog/TagSelector.tsx             # Multi-select tag picker
src/components/blog/ProfileDetailModal.tsx      # User info popup
src/components/nav/TabNav.tsx                   # Discover/Following tabs
src/components/search/SearchBar.tsx             # Search input + results
src/components/search/SearchResults.tsx         # Search results display
```

### Modified Files

```
prisma/schema.prisma                           # +Tag, PostTag, ProfileTag, Follow, Like
src/lib/validation.ts                          # bio max 50, +validateTagName
src/middleware.ts                               # Add new API paths to matcher
src/app/api/profile/route.ts                   # Support tagIds in PUT
src/components/modals/CreatePostModal.tsx       # Milkdown + import integration
src/components/modals/EditPostModal.tsx         # Milkdown integration
src/components/modals/EditProfileModal.tsx      # TagSelector integration
src/components/blog/BlogHeader.tsx              # Tags display, FollowButton, line-clamp
src/components/blog/BlogPostCard.tsx            # Tags display, follow badge
src/app/(main)/page.tsx                         # TabNav + SearchBar + feed
src/app/[username]/page.tsx                     # Pass follow state via SSR
src/app/[username]/BlogPageClient.tsx           # ProfileDetailModal integration
src/app/[username]/[postId]/PostPageClient.tsx  # LikeButton integration
```

---

## Stage 1: Foundation Expansion

### Task 1.1: Extend Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add new models to schema**

Add after the existing `RateLimit` model:

```prisma
model Tag {
  id        String       @id @default(cuid())
  name      String       @unique
  posts     PostTag[]
  profiles  ProfileTag[]
}

model PostTag {
  postId String
  tagId  String
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}

model ProfileTag {
  profileId String
  tagId     String
  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([profileId, tagId])
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
}
```

- [ ] **Step 1b: Add relations to existing models**

Add to `User` model (after `password` field):

```prisma
  following  Follow[]  @relation("Following")
  followers  Follow[]  @relation("Followers")
  likes      Like[]
```

Add to `Profile` model (after `updatedAt` field):

```prisma
  tags ProfileTag[]
```

Add to `Post` model (after `updatedAt` field):

```prisma
  tags  PostTag[]
  likes Like[]
```

- [ ] **Step 2: Push schema to database**

Run:
```bash
npx prisma db push
```
Expected: No errors, tables created.

- [ ] **Step 3: Regenerate Prisma Client**

Run:
```bash
npx prisma generate
```
Expected: `@prisma/client` regenerated with new types.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Tag, PostTag, ProfileTag, Follow, Like models to Prisma schema"
```

---

### Task 1.2: Install New Dependencies

- [ ] **Step 1: Install packages**

Run:
```bash
npm install @milkdown/kit @milkdown/react zustand mammoth
```

- [ ] **Step 2: Install type packages**

Run:
```bash
npm install -D @types/mammoth
```

- [ ] **Step 3: Verify install**

Run:
```bash
node -e "require('zustand'); require('mammoth'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install milkdown, zustand, mammoth for V2"
```

---

### Task 1.3: Update Validation (bio 500→50, add tag validation)

**Files:**
- Modify: `src/lib/validation.ts`
- Test: `src/__tests__/lib/validation.test.ts`

- [ ] **Step 1: Write failing test for bio length validation**

```typescript
// src/__tests__/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateLength } from '@/lib/validation';

describe('validateLength', () => {
  it('should reject bio longer than 50 characters', () => {
    const result = validateLength('a'.repeat(51), 'bio', 0, 50);
    expect(result.valid).toBe(false);
  });

  it('should accept bio of exactly 50 characters', () => {
    const result = validateLength('a'.repeat(50), 'bio', 0, 50);
    expect(result.valid).toBe(true);
  });

  it('should accept empty bio', () => {
    const result = validateLength('', 'bio', 0, 50);
    expect(result.valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/__tests__/lib/validation.test.ts
```
Expected: FAIL (current default max > 50)

- [ ] **Step 3: Update validation constants**

In `src/lib/validation.ts`, find the export of validation limits and ensure the bio constraint is max 50. The existing code likely has a generic `validateField` function. Add:

```typescript
export function validateBio(value: unknown) {
  return validateField(value, 'bio', 0, 50);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/__tests__/lib/validation.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/__tests__/lib/validation.test.ts
git commit -m "feat: limit bio to 50 chars, add validateBio helper"
```

---

### Task 1.4: Create zustand UI Store

**Files:**
- Create: `src/lib/store.ts`

- [ ] **Step 1: Write the store**

```typescript
// src/lib/store.ts
'use client';

import { create } from 'zustand';

export type ActiveTab = 'discover' | 'following';

interface AppState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  setIsSearching: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'discover',
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  isSearching: false,
  setIsSearching: (v) => set({ isSearching: v }),
}));
```

- [ ] **Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat: add zustand store for UI state (tab, search)"
```

---

### Task 1.5: Create Service Layer Skeletons

**Files:**
- Create: `src/lib/tags.ts`
- Create: `src/lib/search.ts`
- Create: `src/lib/import.ts`

- [ ] **Step 1: Create tags service**

```typescript
// src/lib/tags.ts
export const PRESET_TAGS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'CSS',
  'Frontend', 'Backend', 'Fullstack', 'Design', 'Life',
  'Tutorial', 'Opinion',
];

export function validateTagName(name: unknown): { valid: boolean; error?: string } {
  if (typeof name !== 'string') return { valid: false, error: 'Tag name must be a string' };
  if (name.length < 1 || name.length > 30) return { valid: false, error: 'Tag name must be 1-30 characters' };
  if (!/^[a-zA-Z0-9\u4e00-\u9fff\s._-]+$/.test(name)) return { valid: false, error: 'Tag name contains invalid characters' };
  return { valid: true };
}
```

- [ ] **Step 2: Create search service**

```typescript
// src/lib/search.ts
import { prisma } from './prisma';

export interface SearchResults {
  users: Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>;
  posts: Array<{ id: string; title: string; username: string; createdAt: Date }>;
  tags: Array<{ id: string; name: string }>;
}

export async function searchAll(query: string, limit = 20): Promise<SearchResults> {
  const q = `%${query}%`;
  const [users, posts, tags] = await Promise.all([
    prisma.user.findMany({
      where: { username: { contains: query } },
      select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
      take: limit,
    }),
    prisma.post.findMany({
      where: { title: { contains: query }, published: true },
      select: { id: true, title: true, createdAt: true, user: { select: { username: true } } },
      take: limit,
    }),
    prisma.tag.findMany({
      where: { name: { contains: query } },
      select: { id: true, name: true },
      take: limit,
    }),
  ]);

  return {
    users: users.map(u => ({ id: u.id, username: u.username, displayName: u.profile?.displayName ?? u.username, avatarUrl: u.profile?.avatarUrl ?? null })),
    posts: posts.map(p => ({ id: p.id, title: p.title, username: p.user.username, createdAt: p.createdAt })),
    tags,
  };
}
```

- [ ] **Step 3: Create import service**

```typescript
// src/lib/import.ts
export interface ImportResult {
  content: string;
  filename: string;
  wordCount: number;
  warnings: string[];
}

export async function parseMarkdown(file: File): Promise<ImportResult> {
  const content = await file.text();
  return {
    content,
    filename: file.name,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    warnings: [],
  };
}

export async function parseDocx(file: File): Promise<ImportResult> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const warnings: string[] = [];
  if (result.messages.length > 0) {
    warnings.push(...result.messages.map(m => `Parse note: ${m.message}`));
  }
  return {
    content: result.value,
    filename: file.name,
    wordCount: result.value.split(/\s+/).filter(Boolean).length,
    warnings,
  };
}

export function validateImportFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'text/markdown', 'text/plain', '',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  const ALLOWED_EXTENSIONS = ['.md', '.docx', '.doc'];

  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported format: ${ext}. Allowed: .md, .docx, .doc` };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 10MB` };
  }
  return { valid: true };
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tags.ts src/lib/search.ts src/lib/import.ts
git commit -m "feat: add service layer skeletons (tags, search, import)"
```

---

### Task 1.6: Update Middleware for New API Routes

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add new route patterns to matcher**

Read `src/middleware.ts` and add these paths to the existing config matcher array:
`'/api/users/:path*'`, `'/api/import/:path*'`, `'/api/feed/:path*'`

```typescript
export const config = {
  matcher: [
    '/api/profile/:path*',
    '/api/posts/:path*',
    '/api/my-posts',
    '/api/upload',
    '/api/users/:path*',   // NEW
    '/api/import/:path*',  // NEW
    '/api/feed/:path*',    // NEW
  ],
};
```

Note: The existing middleware logic already protects non-GET requests on matched paths, so the new POST routes (follow, like, import) will automatically require authentication. GET routes (search, followers, feed) pass through.

- [ ] **Step 2: Verify middleware still works**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: extend middleware matcher for new V2 API routes"
```

---

## Stage 2: Import + Editor (Core Experience)

### Task 2.1: Implement POST /api/import

**Files:**
- Create: `src/app/api/import/route.ts`
- Test: `src/__tests__/api/import.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/api/import.test.ts
import { describe, it, expect } from 'vitest';
import { validateImportFile, parseMarkdown } from '@/lib/import';

describe('validateImportFile', () => {
  it('should reject files larger than 10MB', () => {
    const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.md', { type: 'text/markdown' });
    const result = validateImportFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('should reject unsupported extensions', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    const result = validateImportFile(file);
    expect(result.valid).toBe(false);
  });

  it('should accept .md files', () => {
    const file = new File(['# Hello'], 'post.md', { type: 'text/markdown' });
    const result = validateImportFile(file);
    expect(result.valid).toBe(true);
  });
});

describe('parseMarkdown', () => {
  it('should extract content from markdown file', async () => {
    const file = new File(['# Hello\n\nWorld'], 'test.md', { type: 'text/markdown' });
    const result = await parseMarkdown(file);
    expect(result.content).toBe('# Hello\n\nWorld');
    expect(result.wordCount).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify**

Run:
```bash
npx vitest run src/__tests__/api/import.test.ts
```
Expected: PASS (these test the lib, not the route yet)

- [ ] **Step 3: Write the API route**

```typescript
// src/app/api/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateImportFile, parseMarkdown, parseDocx } from '@/lib/import';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResult = await checkRateLimit('import');
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validation = validateImportFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    let result;
    if (ext === '.md') {
      result = await parseMarkdown(file);
    } else {
      result = await parseDocx(file);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import failed:', error);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Add rate-limit action for import**

In `src/lib/rate-limit.ts`, add `'import'` to the actions map:

```typescript
// Find the action name type or the map of limits. In the existing code,
// there should be a map like:
// const LIMITS = { comment: { max: 5, window: 60 }, register: { max: 3, window: 3600 } }
// Add:
// import: { max: 10, window: 60 }
```

- [ ] **Step 5: Manual test with curl**

Run:
```bash
echo "# Test Post" > /tmp/test.md
curl -X POST http://localhost:3000/api/import -F "file=@/tmp/test.md" -b "$COOKIE"
```
Expected: JSON with `content`, `filename`, `wordCount`.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/import/route.ts src/__tests__/api/import.test.ts src/lib/rate-limit.ts
git commit -m "feat: implement POST /api/import with markdown/docx parsing"
```

---

### Task 2.2: Create Milkdown WYSIWYG Editor Component

**Files:**
- Create: `src/components/editor/MarkdownEditor.tsx`

- [ ] **Step 1: Write the editor component**

```typescript
// src/components/editor/MarkdownEditor.tsx
'use client';

import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { gfm } from '@milkdown/kit/preset/gfm';
import { history } from '@milkdown/kit/plugin/history';
import { tooltip } from '@milkdown/kit/plugin/tooltip';

interface MarkdownEditorProps {
  initialValue?: string;
  onChange?: (markdown: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export interface MarkdownEditorHandle {
  getValue: () => string;
  setValue: (markdown: string) => void;
}

const MilkdownEditorInner = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MilkdownEditorInner({ initialValue = '', onChange, placeholder = 'Start writing...' }, ref) {
    const [ready, setReady] = useState(false);

    useEditor((root) => {
      return Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
          ctx.set(defaultValueCtx, initialValue);
        })
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(tooltip);
    }, []);

    useEffect(() => {
      setReady(true);
    }, []);

    useImperativeHandle(ref, () => ({
      getValue: () => {
        const editor = Editor.getActive();
        if (!editor) return '';
        return editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          return view.state.doc.textContent;
        });
      },
      setValue: (markdown: string) => {
        const editor = Editor.getActive();
        if (editor) {
          editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            const { state } = view;
            const tr = state.tr.replaceWith(0, state.doc.content.size, state.schema.text(markdown));
            view.dispatch(tr);
          });
        }
      },
    }));

    return (
      <div className="milkdown-editor border border-zinc-200 rounded-lg overflow-hidden">
        <Milkdown />
        {!ready && (
          <div className="animate-pulse p-4 space-y-3">
            <div className="h-6 bg-zinc-100 rounded w-3/4" />
            <div className="h-4 bg-zinc-100 rounded w-full" />
            <div className="h-4 bg-zinc-100 rounded w-2/3" />
          </div>
        )}
        <style jsx global>{`
          .milkdown-editor .editor {
            padding: 1rem;
            min-height: 300px;
            outline: none;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 1rem;
            line-height: 1.75;
          }
          .milkdown-editor .editor h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
          .milkdown-editor .editor h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
          .milkdown-editor .editor h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
          .milkdown-editor .editor p { margin: 0.5rem 0; }
          .milkdown-editor .editor code { font-family: 'JetBrains Mono', monospace; background: #f4f4f5; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; }
          .milkdown-editor .editor pre { background: #18181b; color: #fafafa; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
          .milkdown-editor .editor pre code { background: none; padding: 0; color: inherit; }
          .milkdown-editor .editor blockquote { border-left: 3px solid #e4e4e7; padding-left: 1rem; margin: 0.75rem 0; color: #52525b; }
          .milkdown-editor .editor ul, .milkdown-editor .editor ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        `}</style>
      </div>
    );
  }
);

export default function MarkdownEditor(props: MarkdownEditorProps) {
  const editorRef = useRef<MarkdownEditorHandle>(null);

  return (
    <MilkdownProvider>
      <MilkdownEditorInner ref={editorRef} {...props} />
    </MilkdownProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/MarkdownEditor.tsx
git commit -m "feat: add Milkdown WYSIWYG editor component"
```

---

### Task 2.3: Create FileImportDropzone Component

**Files:**
- Create: `src/components/editor/FileImportDropzone.tsx`

- [ ] **Step 1: Write the dropzone component**

```typescript
// src/components/editor/FileImportDropzone.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { validateImportFile } from '@/lib/import';

interface FileImportDropzoneProps {
  onFileParsed: (content: string, filename: string, warnings: string[]) => void;
}

export default function FileImportDropzone({ onFileParsed }: FileImportDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const validation = validateImportFile(file);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file');
      return;
    }
    setError(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Import failed');
      }

      const data = await res.json();
      onFileParsed(data.content, data.filename, data.warnings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  }, [onFileParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-zinc-300 hover:border-zinc-400 bg-white'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.docx,.doc,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          onChange={handleFileSelect}
          className="hidden"
        />
        {isProcessing ? (
          <div className="space-y-2">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-zinc-500">Parsing file...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="w-8 h-8 mx-auto text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-zinc-600">Drag a file here, or click to select</p>
            <p className="text-xs text-zinc-400">Supports .md, .docx, .doc &middot; Max 10MB</p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/FileImportDropzone.tsx
git commit -m "feat: add drag-and-drop file import component"
```

---

### Task 2.4: Integrate Editor + Import into CreatePostModal

**Files:**
- Modify: `src/components/modals/CreatePostModal.tsx`

- [ ] **Step 1: Read current CreatePostModal**

Read `src/components/modals/CreatePostModal.tsx` to understand current structure.

- [ ] **Step 2: Replace textarea with MarkdownEditor + FileImportDropzone**

The key change: replace the `<textarea>` block with the new components. The modal structure becomes:

```tsx
// Inside CreatePostModal, replace the textarea section:

{/* Import area - always visible */}
<div className="mb-4">
  <FileImportDropzone
    onFileParsed={(content, filename, warnings) => {
      setTitle(filename.replace(/\.[^.]+$/, ''));
      setContent(content);
      if (warnings.length > 0) {
        showToast(`File imported with ${warnings.length} warning(s). Please review content.`, 'warning');
      }
    }}
  />
</div>

{/* WYSIWYG Editor */}
<div className="mb-4 min-h-[300px]">
  <MarkdownEditor
    initialValue={content}
    onChange={(md) => setContent(md)}
  />
</div>
```

The title input and action buttons remain as-is. State variables `title` and `content` are already managed by useState.

- [ ] **Step 3: Verify the modal opens and renders**

Run:
```bash
npm run dev
```
Open browser at localhost:3000, login, go to blog page, click "Write Post".
Expected: Modal opens with import dropzone + editor. No errors in console.

- [ ] **Step 4: Commit**

```bash
git add src/components/modals/CreatePostModal.tsx
git commit -m "feat: integrate Milkdown editor and file import into CreatePostModal"
```

---

### Task 2.5: Integrate Editor into EditPostModal

**Files:**
- Modify: `src/components/modals/EditPostModal.tsx`

- [ ] **Step 1: Read current EditPostModal and replace textarea with MarkdownEditor**

Same pattern as Task 2.4, but EditPostModal does NOT need the FileImportDropzone (editing existing posts).

Replace the textarea section with:
```tsx
<div className="mb-4 min-h-[300px]">
  <MarkdownEditor
    initialValue={content}
    onChange={(md) => setContent(md)}
  />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/EditPostModal.tsx
git commit -m "feat: integrate Milkdown editor into EditPostModal"
```

---

### Task 2.6: E2E Test — Import + Publish Flow

**Files:**
- Create: `e2e/v2-import.spec.ts`

- [ ] **Step 1: Write the e2e test**

```typescript
// e2e/v2-import.spec.ts
import { test, expect } from '@playwright/test';

test('import markdown file and publish post', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'test123456');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/[a-z0-9_-]+$/);

  // Click "Write Post"
  await page.click('text=Write Post');

  // Upload a markdown file via the file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'hello-world.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Hello V2\n\nThis is an imported post.'),
  });

  // Wait for content to appear in the editor
  await expect(page.locator('.milkdown-editor')).toContainText('Hello V2');

  // Fill title and publish
  await page.fill('input[placeholder*="Title" i]', 'Imported Post');
  await page.click('button:has-text("Publish")');

  // Verify post appears in the list
  await expect(page.locator('text=Imported Post')).toBeVisible();
});
```

- [ ] **Step 2: Run the test**

Run:
```bash
npx playwright test e2e/v2-import.spec.ts
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add e2e/v2-import.spec.ts
git commit -m "test: add e2e test for import and publish flow"
```

---

## Stage 3: Tag System

### Task 3.1: Implement GET /api/tags

**Files:**
- Create: `src/app/api/tags/route.ts`
- Test: `src/__tests__/api/tags.test.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PRESET_TAGS, validateTagName } from '@/lib/tags';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  const tags = await prisma.tag.findMany({
    where: q ? { name: { contains: q } } : {},
    orderBy: { name: 'asc' },
    take: 50,
    select: { id: true, name: true },
  });

  return NextResponse.json({ tags, presets: PRESET_TAGS });
}
```

- [ ] **Step 2: Test with curl**

Run:
```bash
curl http://localhost:3000/api/tags
```
Expected: JSON with `tags` array and `presets` array.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/tags/route.ts
git commit -m "feat: add GET /api/tags endpoint"
```

---

### Task 3.2: Extend PUT /api/profile to Support tagIds

**Files:**
- Modify: `src/app/api/profile/route.ts`

- [ ] **Step 1: Read current profile route**

Read `src/app/api/profile/route.ts` to understand the PUT handler.

- [ ] **Step 2: Add tagIds handling**

In the PUT handler, after updating profile fields, add tag sync logic:

```typescript
// After updating profile fields (displayName, bio, avatarUrl):
if (tagIds !== undefined) {
  // Validate max 6 tags
  if (tagIds.length > 6) {
    return NextResponse.json({ error: 'Maximum 6 tags allowed' }, { status: 400 });
  }

  // Delete all existing profile tags, then create new ones
  await prisma.profileTag.deleteMany({ where: { profileId: profile.id } });
  if (tagIds.length > 0) {
    await prisma.profileTag.createMany({
      data: tagIds.map((tagId: string) => ({ profileId: profile.id, tagId })),
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profile/route.ts
git commit -m "feat: support tagIds in profile update API"
```

---

### Task 3.3: Create TagBadge Component

**Files:**
- Create: `src/components/blog/TagBadge.tsx`

- [ ] **Step 1: Write TagBadge**

```typescript
// src/components/blog/TagBadge.tsx
interface TagBadgeProps {
  name: string;
}

export default function TagBadge({ name }: TagBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer">
      {name}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/TagBadge.tsx
git commit -m "feat: add TagBadge component"
```

---

### Task 3.4: Create TagSelector Component

**Files:**
- Create: `src/components/blog/TagSelector.tsx`

- [ ] **Step 1: Write TagSelector**

```typescript
// src/components/blog/TagSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import TagBadge from './TagBadge';
import { PRESET_TAGS, validateTagName } from '@/lib/tags';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

interface TagOption {
  id: string;
  name: string;
  isPreset: boolean;
}

export default function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.json())
      .then(data => {
        const tags = data.tags || [];
        setAllTags(tags);
      });
  }, []);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      if (selectedTagIds.length >= 6) {
        setError('Maximum 6 tags');
        return;
      }
      onChange([...selectedTagIds, tagId]);
      setError(null);
    }
  };

  const addCustomTag = async () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const validation = validateTagName(trimmed);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid tag');
      return;
    }
    if (selectedTagIds.length >= 6) {
      setError('Maximum 6 tags');
      return;
    }

    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 409) {
        // Tag already exists, find it and add
        const existing = allTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) {
          toggleTag(existing.id);
        }
      }
      return;
    }
    const tag = await res.json();
    setAllTags(prev => [...prev, { id: tag.id, name: tag.name, isPreset: false }]);
    onChange([...selectedTagIds, tag.id]);
    setCustomInput('');
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">Tags (max 6)</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {allTags.map(tag => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`
              inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium transition-all
              ${selectedTagIds.includes(tag.id)
                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }
            `}
          >
            {tag.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
          placeholder="Add custom tag..."
          className="flex-1 px-3 py-1.5 text-sm border border-zinc-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="px-3 py-1.5 text-sm bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Add POST /api/tags handler**

Extend `src/app/api/tags/route.ts` with a POST handler:

```typescript
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  const validation = validateTagName(name);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const existing = await prisma.tag.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(existing, { status: 409 });
  }

  const tag = await prisma.tag.create({ data: { name } });
  return NextResponse.json(tag, { status: 201 });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/TagSelector.tsx src/app/api/tags/route.ts
git commit -m "feat: add TagSelector component and POST /api/tags"
```

---

### Task 3.5: Integrate Tags into EditProfileModal

**Files:**
- Modify: `src/components/modals/EditProfileModal.tsx`

- [ ] **Step 1: Add TagSelector to the modal**

Read `src/components/modals/EditProfileModal.tsx`. Find the form fields section and add after the bio field:

```tsx
<TagSelector
  selectedTagIds={tagIds}
  onChange={setTagIds}
/>
```

Add state:
```tsx
const [tagIds, setTagIds] = useState<string[]>([]);
```

Load existing tags on modal open (fetch from profile).

Update the save handler to include `tagIds` in the PUT request body.

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/EditProfileModal.tsx
git commit -m "feat: integrate TagSelector into EditProfileModal"
```

---

### Task 3.6: Display Tags in BlogHeader and BlogPostCard

**Files:**
- Modify: `src/components/blog/BlogHeader.tsx`
- Modify: `src/components/blog/BlogPostCard.tsx`

- [ ] **Step 1: Add tags to BlogHeader**

In `src/components/blog/BlogHeader.tsx`, add after the bio line:

```tsx
{profile.tags && profile.tags.length > 0 && (
  <div className="flex flex-wrap gap-1.5 mt-1">
    {profile.tags.slice(0, 2).map((pt: { tag: { id: string; name: string } }) => (
      <TagBadge key={pt.tag.id} name={pt.tag.name} />
    ))}
    {profile.tags.length > 2 && (
      <span className="text-xs text-zinc-400 self-center">+{profile.tags.length - 2} more</span>
    )}
  </div>
)}
```

Also update the bio line to clamp to one line:
```tsx
<p className="text-sm text-zinc-600 line-clamp-1">{profile.bio}</p>
```

- [ ] **Step 2: Add tags to BlogPostCard**

In `src/components/blog/BlogPostCard.tsx`, add after the bio/description line:

```tsx
{profile.tags && profile.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-1.5">
    {profile.tags.slice(0, 2).map((pt: { tag: { id: string; name: string } }) => (
      <TagBadge key={pt.tag.id} name={pt.tag.name} />
    ))}
    {profile.tags.length > 2 && (
      <span className="text-xs text-zinc-400">...</span>
    )}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/BlogHeader.tsx src/components/blog/BlogPostCard.tsx
git commit -m "feat: display tags in BlogHeader and BlogPostCard, clamp bio to 1 line"
```

---

## Stage 4: Follow System

### Task 4.1: Implement POST /api/users/[username]/follow (toggle)

**Files:**
- Create: `src/app/api/users/[username]/follow/route.ts`

- [ ] **Step 1: Write the toggle endpoint**

```typescript
// src/app/api/users/[username]/follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username } = await params;
  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (targetUser.id === session.user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: targetUser.id } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  } else {
    await prisma.follow.create({
      data: { followerId: session.user.id, followingId: targetUser.id },
    });
    return NextResponse.json({ following: true });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/users/[username]/follow/route.ts
git commit -m "feat: implement follow/unfollow toggle API"
```

---

### Task 4.2: Implement GET /api/users/[username]/followers + following

**Files:**
- Create: `src/app/api/users/[username]/followers/route.ts`
- Create: `src/app/api/users/[username]/following/route.ts`

- [ ] **Step 1: Write followers list endpoint**

```typescript
// src/app/api/users/[username]/followers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const followers = await prisma.follow.findMany({
    where: { followingId: user.id },
    include: { follower: { include: { profile: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({
    count: followers.length,
    followers: followers.map(f => ({
      id: f.follower.id,
      username: f.follower.username,
      displayName: f.follower.profile?.displayName ?? f.follower.username,
      avatarUrl: f.follower.profile?.avatarUrl,
    })),
  });
}
```

- [ ] **Step 2: Write following list endpoint**

Create `src/app/api/users/[username]/following/route.ts` with the same structure but querying `where: { followerId: user.id }`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/users/
git commit -m "feat: add follower and following list endpoints"
```

---

### Task 4.3: Implement GET /api/feed

**Files:**
- Create: `src/app/api/feed/route.ts`

- [ ] **Step 1: Write feed endpoint**

```typescript
// src/app/api/feed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  const following = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  });

  const followingIds = following.map(f => f.followingId);
  if (followingIds.length === 0) {
    return NextResponse.json({ posts: [], hasMore: false });
  }

  const posts = await prisma.post.findMany({
    where: { userId: { in: followingIds }, published: true },
    include: {
      user: { include: { profile: true } },
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit + 1,
  });

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  return NextResponse.json({ posts, hasMore });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/feed/route.ts
git commit -m "feat: add following feed API endpoint"
```

---

### Task 4.4: Create FollowButton Component

**Files:**
- Create: `src/components/blog/FollowButton.tsx`

- [ ] **Step 1: Write FollowButton**

```typescript
// src/components/blog/FollowButton.tsx
'use client';

import { useState } from 'react';

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
}

export default function FollowButton({ username, initialIsFollowing, isOwnProfile }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  if (isOwnProfile) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
        ${isFollowing
          ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
          : 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
```

- [ ] **Step 2: Integrate into BlogHeader**

In `src/components/blog/BlogHeader.tsx`, add FollowButton next to the username. The `initialIsFollowing` prop comes from SSR (see Task 4.6).

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/FollowButton.tsx src/components/blog/BlogHeader.tsx
git commit -m "feat: add FollowButton component with toggle"
```

---

### Task 4.5: Create ProfileDetailModal

**Files:**
- Create: `src/components/blog/ProfileDetailModal.tsx`

- [ ] **Step 1: Write ProfileDetailModal**

```typescript
// src/components/blog/ProfileDetailModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import TagBadge from './TagBadge';

interface ProfileDetailModalProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDetailModal({ username, isOpen, onClose }: ProfileDetailModalProps) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && username) {
      Promise.all([
        fetch(`/api/profile/${username}`).then(r => r.json()),
        fetch(`/api/users/${username}/followers`).then(r => r.json()),
        fetch(`/api/users/${username}/following`).then(r => r.json()),
      ]).then(([profile, followers, following]) => {
        setData({ profile, followers, following });
      });
    }
  }, [isOpen, username]);

  if (!data) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Details">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {data.profile?.avatarUrl && (
            <img src={data.profile.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
          )}
          <div>
            <h3 className="text-lg font-semibold">{data.profile?.displayName || username}</h3>
            <p className="text-sm text-zinc-500">@{username}</p>
          </div>
        </div>

        {data.profile?.bio && (
          <p className="text-sm text-zinc-700">{data.profile.bio}</p>
        )}

        <div className="flex gap-4 text-sm text-zinc-600">
          <span><strong>{data.following?.count || 0}</strong> following</span>
          <span><strong>{data.followers?.count || 0}</strong> followers</span>
        </div>

        {data.profile?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.profile.tags.map((pt: { tag: { id: string; name: string } }) => (
              <TagBadge key={pt.tag.id} name={pt.tag.name} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/ProfileDetailModal.tsx
git commit -m "feat: add profile detail popup modal"
```

---

### Task 4.6: SSR Pre-fetch Follow State on Blog Page

**Files:**
- Modify: `src/app/[username]/page.tsx`
- Modify: `src/app/[username]/BlogPageClient.tsx`

- [ ] **Step 1: Add follow check to server component**

In `src/app/[username]/page.tsx`, add to the server-side data fetch:

```typescript
// After fetching profile and posts:
const session = await getServerSession(authOptions);
let isFollowing = false;
if (session?.user?.id && session.user.username !== params.username) {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: user.id,
      },
    },
  });
  isFollowing = !!follow;
}
```

Pass `isFollowing` and `session?.user?.username` to the client component.

- [ ] **Step 2: Pass props to BlogPageClient**

In `BlogPageClient.tsx`, receive the new props and pass them to BlogHeader.

- [ ] **Step 3: Commit**

```bash
git add src/app/[username]/page.tsx src/app/[username]/BlogPageClient.tsx
git commit -m "feat: SSR pre-fetch follow state, integrate FollowButton and ProfileDetailModal"
```

---

## Stage 5: Home Page Enhancement

### Task 5.1: Create TabNav Component

**Files:**
- Create: `src/components/nav/TabNav.tsx`

- [ ] **Step 1: Write TabNav with animated underline**

```typescript
// src/components/nav/TabNav.tsx
'use client';

import { useAppStore, type ActiveTab } from '@/lib/store';

const tabs: { key: ActiveTab; label: string }[] = [
  { key: 'discover', label: 'Discover' },
  { key: 'following', label: 'Following' },
];

export default function TabNav() {
  const activeTab = useAppStore(state => state.activeTab);
  const setActiveTab = useAppStore(state => state.setActiveTab);
  const activeIndex = tabs.findIndex(t => t.key === activeTab);

  return (
    <div className="relative border-b border-zinc-200">
      <nav className="flex gap-6" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              relative pb-3 text-sm font-medium transition-colors duration-200
              ${activeTab === tab.key ? 'text-blue-600' : 'text-zinc-500 hover:text-zinc-700'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div
        className="absolute bottom-0 h-0.5 bg-blue-500 transition-transform duration-300 rounded-full"
        style={{
          width: '60px',
          transform: `translateX(${activeIndex * 88}px)`,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/nav/TabNav.tsx
git commit -m "feat: add TabNav component with animated underline"
```

---

### Task 5.2: Create SearchBar + SearchResults Components

**Files:**
- Create: `src/components/search/SearchBar.tsx`
- Create: `src/components/search/SearchResults.tsx`

- [ ] **Step 1: Write SearchBar with debounce**

```typescript
// src/components/search/SearchBar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import SearchResults from './SearchResults';

export default function SearchBar() {
  const searchQuery = useAppStore(s => s.searchQuery);
  const setSearchQuery = useAppStore(s => s.setSearchQuery);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setResults(null);
      setShowResults(false);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(data => {
        setResults(data);
        setShowResults(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-64">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={localQuery}
          onChange={(e) => { setLocalQuery(e.target.value); setSearchQuery(e.target.value); }}
          onFocus={() => results && setShowResults(true)}
          placeholder="Search users, posts, tags..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
        />
      </div>
      {showResults && (
        <SearchResults results={results} loading={loading} onClose={() => setShowResults(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write SearchResults dropdown**

```typescript
// src/components/search/SearchResults.tsx
'use client';

import Link from 'next/link';

interface SearchResultsProps {
  results: any;
  loading: boolean;
  onClose: () => void;
}

export default function SearchResults({ results, loading, onClose }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="absolute top-full mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg z-50 p-3">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-zinc-100 rounded w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  if (!results) return null;

  const { users = [], posts = [], tags = [] } = results;
  const isEmpty = users.length === 0 && posts.length === 0 && tags.length === 0;

  return (
    <div className="absolute top-full mt-1 w-80 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {isEmpty ? (
        <div className="p-4 text-sm text-zinc-500 text-center">
          No results found. Try a different search term.
        </div>
      ) : (
        <div className="py-1">
          {users.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase">Users</div>
              {users.map((u: any) => (
                <Link key={u.id} href={`/${u.username}`} onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 transition-colors">
                  {u.avatarUrl && <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full" />}
                  <div>
                    <span className="text-sm font-medium">{u.displayName}</span>
                    <span className="text-xs text-zinc-400 ml-1">@{u.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {posts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase border-t border-zinc-100">Posts</div>
              {posts.map((p: any) => (
                <Link key={p.id} href={`/${p.username}/${p.id}`} onClick={onClose}
                  className="block px-3 py-2 hover:bg-zinc-50 transition-colors">
                  <span className="text-sm">{p.title}</span>
                  <span className="text-xs text-zinc-400 ml-2">by @{p.username}</span>
                </Link>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase border-t border-zinc-100">Tags</div>
              {tags.map((t: any) => (
                <Link key={t.id} href={`/?tag=${t.name}`} onClick={onClose}
                  className="block px-3 py-2 hover:bg-zinc-50 transition-colors text-sm">
                  #{t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/search/SearchBar.tsx src/components/search/SearchResults.tsx
git commit -m "feat: add SearchBar and SearchResults components"
```

---

### Task 5.3: Implement GET /api/search

**Files:**
- Create: `src/app/api/search/route.ts`

- [ ] **Step 1: Write the search endpoint**

```typescript
// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchAll } from '@/lib/search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  if (q.length < 1) {
    return NextResponse.json({ users: [], posts: [], tags: [] });
  }

  const results = await searchAll(q);
  return NextResponse.json(results);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/search/route.ts
git commit -m "feat: implement GET /api/search endpoint"
```

---

### Task 5.4: Rebuild Homepage with Tabs + Search + Feed

**Files:**
- Modify: `src/app/(main)/page.tsx`

- [ ] **Step 1: Rewrite homepage as client component with tabs**

The homepage needs to become a client component (or mix SSR + client wrapper). Create a pattern:

```tsx
// src/app/(main)/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DiscoverPage from './DiscoverPageClient';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return <DiscoverPage session={session} />;
}
```

Create `src/app/(main)/DiscoverPageClient.tsx`:

```tsx
'use client';

import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import TabNav from '@/components/nav/TabNav';
import SearchBar from '@/components/search/SearchBar';
import BlogPostCard from '@/components/blog/BlogPostCard';
import EmptyState from '@/components/ui/EmptyState';
import { Session } from 'next-auth';

interface Props {
  session: Session | null;
}

export default function DiscoverPageClient({ session }: Props) {
  const activeTab = useAppStore(s => s.activeTab);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const endpoint = activeTab === 'discover' ? '/api/discover' : '/api/feed';
    fetch(endpoint)
      .then(r => r.json())
      .then(data => setPosts(data.posts || data.profiles || []))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TabNav />
        <SearchBar />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-zinc-100 animate-pulse rounded-xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="📝"
          title={activeTab === 'discover' ? 'No blogs published yet' : 'Not following anyone yet'}
          description={activeTab === 'discover' ? 'Be the first to publish a blog!' : 'Go to Discover to find bloggers to follow.'}
          cta={activeTab === 'discover' ? undefined : { label: 'Discover', onClick: () => useAppStore.getState().setActiveTab('discover') }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((item: any) => (
            <BlogPostCard key={item.id} {...item} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/
git commit -m "feat: rebuild homepage with tabs, search, and feed"
```

---

## Stage 6: Likes + Profile Polish

### Task 6.1: Implement POST /api/posts/[id]/like (toggle with transaction)

**Files:**
- Create: `src/app/api/posts/[id]/like/route.ts`

- [ ] **Step 1: Write the like toggle with transaction**

```typescript
// src/app/api/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { userId_postId: { userId, postId: id } },
      });

      if (existing) {
        await tx.like.delete({ where: { id: existing.id } });
        return { liked: false };
      } else {
        await tx.like.create({ data: { userId, postId: id } });
        return { liked: true };
      }
    });

    const count = await prisma.like.count({ where: { postId: id } });
    return NextResponse.json({ liked: result.liked, count });
  } catch (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/posts/[id]/like/route.ts
git commit -m "feat: implement like toggle API with transaction"
```

---

### Task 6.2: Create LikeButton Component

**Files:**
- Create: `src/components/blog/LikeButton.tsx`

- [ ] **Step 1: Write LikeButton**

```typescript
// src/components/blog/LikeButton.tsx
'use client';

import { useState } from 'react';

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({ postId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.count);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200
        ${liked ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}
        disabled:opacity-50
      `}
    >
      <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}
```

- [ ] **Step 2: Integrate into PostPageClient**

In `src/app/[username]/[postId]/PostPageClient.tsx`, add LikeButton after the post content:

```tsx
<LikeButton postId={post.id} initialLiked={liked} initialCount={likeCount} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/LikeButton.tsx src/app/[username]/[postId]/PostPageClient.tsx
git commit -m "feat: add LikeButton component, integrate into post page"
```

---

### Task 6.3: Implement GET /api/users/[username]/likes

**Files:**
- Create: `src/app/api/users/[username]/likes/route.ts`

- [ ] **Step 1: Write the likes list endpoint**

```typescript
// src/app/api/users/[username]/likes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const likes = await prisma.like.findMany({
    where: { userId: user.id },
    include: {
      post: {
        include: { user: { select: { username: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    posts: likes.map(l => ({
      id: l.post.id,
      title: l.post.title,
      username: l.post.user.username,
      likedAt: l.createdAt,
    })),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/users/[username]/likes/route.ts
git commit -m "feat: add liked posts endpoint"
```

---

### Task 6.4: Line-Clamp Bio + Integration Polish

**Files:**
- Modify: `src/components/blog/BlogHeader.tsx`

- [ ] **Step 1: Ensure bio is line-clamped**

The bio line should use Tailwind's `line-clamp-1` class (already added in Task 3.6). Verify it renders correctly on mobile.

- [ ] **Step 2: Integrate ProfileDetailModal trigger**

Wrap the username/displayName in a clickable element that opens ProfileDetailModal:

```tsx
<button onClick={() => setDetailOpen(true)} className="hover:underline text-left">
  <h1 className="text-2xl font-bold">{profile.displayName}</h1>
  <p className="text-sm text-zinc-500">@{username}</p>
</button>
<ProfileDetailModal username={username} isOpen={detailOpen} onClose={() => setDetailOpen(false)} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/BlogHeader.tsx
git commit -m "feat: add line-clamp to bio, integrate ProfileDetailModal trigger"
```

---

## Stage 7: Testing, Build, and Documentation

### Task 7.1: Run All Existing Tests

- [ ] **Step 1: Run unit tests**

```bash
npx vitest run
```
Expected: All tests pass. Fix any failures from V2 changes before proceeding.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: Zero errors. Fix any type errors.

- [ ] **Step 3: Run ESLint**

```bash
npm run lint
```
Expected: Zero errors. Fix any lint violations.

- [ ] **Step 4: Commit any fixes**

```bash
git add -u
git commit -m "fix: resolve test and lint issues from V2 changes"
```

---

### Task 7.2: Write E2E Tests for Key V2 Flows

**Files:**
- Create: `e2e/v2-follow.spec.ts`
- Create: `e2e/v2-search.spec.ts`

- [ ] **Step 1: Write follow flow test**

```typescript
// e2e/v2-follow.spec.ts
import { test, expect } from '@playwright/test';

test('follow another user and see their posts in feed', async ({ page }) => {
  // Login as user1
  // Navigate to user2's blog
  // Click Follow button
  // Verify button changes to "Following"
  // Go to homepage
  // Switch to "Following" tab
  // Verify user2's posts appear
});
```

- [ ] **Step 2: Write search test**

```typescript
// e2e/v2-search.spec.ts
import { test, expect } from '@playwright/test';

test('search for posts and users', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[placeholder*="Search"]', 'test');
  // Wait for results dropdown
  await expect(page.locator('text=Users')).toBeVisible();
  // Verify results appear
});
```

- [ ] **Step 3: Run e2e tests**

```bash
npx playwright test e2e/v2-*.spec.ts
```
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add e2e/
git commit -m "test: add e2e tests for follow and search flows"
```

---

### Task 7.3: Production Build Verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```
Expected: Build succeeds with no errors or warnings.

- [ ] **Step 2: Start production server and smoke test**

```bash
npm run start
```
Manually verify: register, login, import a markdown file, publish, view post, like, follow, search.

- [ ] **Step 3: Commit if any build fixes needed**

---

### Task 7.4: Update Documentation

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update CHANGELOG**

Add v2.0.0 section:
```markdown
## v2.0.0 (2026-05-XX)

### Features
- WYSIWYG Markdown editor (Milkdown)
- File import: drag-and-drop .md, .docx, .doc files
- Follow system: follow/unfollow bloggers, following feed
- Tag system: user tags, post tags, tag-based search
- Like button on posts
- Search bar: search users, posts, and tags
- Enhanced homepage: Discover/Following tabs with animated transitions
- Profile detail popup with follow counts
- Bio line-clamp display, max 50 characters

### Breaking Changes
- Bio field maximum reduced from 500 to 50 characters
```

- [ ] **Step 2: Update README with V2 features and new env requirements**

- [ ] **Step 3: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: update README and CHANGELOG for v2.0.0"
```

---

## Task Summary

| Stage | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Foundation | 6 | 2-3 hours |
| 2. Import + Editor | 6 | 3-4 hours |
| 3. Tag System | 6 | 2-3 hours |
| 4. Follow System | 6 | 2-3 hours |
| 5. Home Page | 4 | 2-3 hours |
| 6. Likes + Polish | 4 | 1.5-2 hours |
| 7. Testing + Docs | 4 | 1.5-2 hours |
| **Total** | **36** | **14-20 hours** |

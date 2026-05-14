'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { gfm } from '@milkdown/kit/preset/gfm';
import { history } from '@milkdown/kit/plugin/history';

interface MarkdownEditorProps {
  initialValue?: string;
  onChange?: (markdown: string) => void;
}

async function uploadImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
  } catch {}
  return null;
}

function MilkdownEditorInner({ initialValue = '', onChange }: MarkdownEditorProps) {
  const [ready, setReady] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const previousValueRef = useRef(initialValue);
  const toastRef = useRef<((msg: string, type?: 'error') => void) | null>(null);

  const handleImagePaste = useCallback(async (file: File, view: any) => {
    const url = await uploadImage(file);
    if (!url) {
      toastRef.current?.('图片上传失败', 'error');
      return;
    }
    const { state } = view;
    const { from } = state.selection;
    const node = state.schema.text(`![image](${url})`);
    const tr = state.tr.insert(from, node);
    view.dispatch(tr);
    view.focus();
  }, []);

  const editorInfo = useEditor(
    (root) =>
      Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
          ctx.set(defaultValueCtx, initialValue);
        })
        .use(commonmark)
        .use(gfm)
        .use(history),
    [],
  );

  useEffect(() => {
    if (!editorInfo.loading) {
      const timer = setTimeout(() => setReady(true), 200);
      return () => clearTimeout(timer);
    }
  }, [editorInfo.loading]);

  useEffect(() => {
    if (!ready || initialValue === previousValueRef.current) return;
    const editor = editorInfo.get();
    if (!editor) return;

    previousValueRef.current = initialValue;
    editor.action((ctx: any) => {
      const view = ctx.get(editorViewCtx);
      const { state } = view;
      const node = state.schema.text(initialValue);
      const tr = state.tr.replaceWith(0, state.doc.content.size, node);
      view.dispatch(tr);
    });
  }, [initialValue, ready, editorInfo]);

  useEffect(() => {
    if (!ready) return;
    const editor = editorInfo.get();
    if (!editor) return;

    const view = editor.ctx.get(editorViewCtx) as any;
    if (!view?.dom) return;

    const onInput = () => {
      const fn = onChangeRef.current;
      if (!fn) return;

      editor.action((ctx: any) => {
        const v = ctx.get(editorViewCtx);
        fn(v.state.doc.textContent.trim());
      });
    };

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      let imageFile: File | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          imageFile = items[i].getAsFile();
          break;
        }
      }
      if (!imageFile) return;

      e.preventDefault();
      editor.action((ctx: any) => {
        const v = ctx.get(editorViewCtx);
        handleImagePaste(imageFile!, v);
      });
    };

    view.dom.addEventListener('input', onInput);
    view.dom.addEventListener('paste', onPaste);
    return () => {
      view.dom.removeEventListener('input', onInput);
      view.dom.removeEventListener('paste', onPaste);
    };
  }, [ready, editorInfo, handleImagePaste]);

  return (
    <div className="milkdown-editor border border-zinc-200 rounded-lg overflow-hidden">
      <Milkdown />
      {!ready && (
        <div className="animate-pulse p-4 space-y-3 absolute inset-0 bg-white">
          <div className="h-6 bg-zinc-100 rounded w-3/4" />
          <div className="h-4 bg-zinc-100 rounded w-full" />
          <div className="h-4 bg-zinc-100 rounded w-2/3" />
        </div>
      )}
      <style jsx global>{`
        .milkdown-editor { position: relative; }
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
        .milkdown-editor .editor code {
          font-family: 'JetBrains Mono', monospace;
          background: #f4f4f5;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .milkdown-editor .editor pre {
          background: #18181b;
          color: #fafafa;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .milkdown-editor .editor pre code { background: none; padding: 0; color: inherit; }
        .milkdown-editor .editor blockquote {
          border-left: 3px solid #e4e4e7;
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: #52525b;
        }
        .milkdown-editor .editor ul, .milkdown-editor .editor ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .milkdown-editor .editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .milkdown-editor .editor th, .milkdown-editor .editor td {
          border: 1px solid #d4d4d8;
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .milkdown-editor .editor th {
          background: #f4f4f5;
          font-weight: 600;
        }
        .milkdown-editor .editor tr:nth-child(even) td {
          background: #fafafa;
        }
      `}</style>
    </div>
  );
}

export default function MarkdownEditor(props: MarkdownEditorProps) {
  return (
    <MilkdownProvider>
      <MilkdownEditorInner {...props} />
    </MilkdownProvider>
  );
}

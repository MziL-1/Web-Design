"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface BlogPostContentProps {
  content: string;
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function BlogPostContent({ content }: BlogPostContentProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <article className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ children }) => <h1 className="mb-4 mt-8 text-2xl font-bold">{children}</h1>,
            h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-semibold">{children}</h2>,
            h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold">{children}</h3>,
            p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="mb-4 list-disc pl-6">{children}</ul>,
            ol: ({ children }) => <ol className="mb-4 list-decimal pl-6">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            a: ({ href, children }) => (
              <a href={href} className="text-blue-600 underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              <img
                src={src as string}
                alt={alt as string}
                className="cursor-zoom-in rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => setLightbox({ src: src as string, alt: (alt as string) || "" })}
              />
            ),
            code: ({ children }) => (
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">{children}</code>
            ),
            pre: ({ children }) => (
              <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-100 p-4 text-sm">{children}</pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="mb-4 border-l-4 border-blue-100 pl-4 italic text-gray-600">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
            th: ({ children }) => (
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">{children}</th>
            ),
            td: ({ children }) => (
              <td className="border border-gray-300 px-3 py-2 text-sm">{children}</td>
            ),
            tr: ({ children }) => <tr className="even:bg-gray-50">{children}</tr>,
          }}
        >
          {content}
        </ReactMarkdown>
      </article>

      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

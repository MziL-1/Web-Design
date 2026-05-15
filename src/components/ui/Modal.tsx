"use client";

import { useEffect, useRef, useState } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "default" | "wide";
}

const sizeClasses = {
  default: "max-w-lg",
  wide: "max-w-4xl",
};

export default function Modal({ open, onClose, title, children, size = "default" }: ModalProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
      document.body.style.overflow = "hidden";
    } else {
      setAnimating(false);
      document.body.style.overflow = "";
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setVisible(false);
      }, 400);
    }

    return () => {
      document.body.style.overflow = "";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden ${animating ? "animate-modal-in" : "animate-modal-out"}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>

      <style jsx global>{`
        @keyframes modal-in {
          0% {
            opacity: 0;
            transform: translateY(80px) scale(0.7) rotate(-3deg);
            transform-origin: top left;
          }
          60% {
            opacity: 1;
            transform: translateY(-6px) scale(1.01) rotate(0.15deg);
            transform-origin: top left;
          }
          80% {
            transform: translateY(2px) scale(0.99) rotate(-0.05deg);
            transform-origin: top left;
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
            transform-origin: top left;
          }
        }

        @keyframes modal-out {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
            transform-origin: top left;
          }
          100% {
            opacity: 0;
            transform: translateY(60px) scale(0.85) rotate(2deg);
            transform-origin: top left;
          }
        }

        .animate-modal-in {
          animation: modal-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-modal-out {
          animation: modal-out 0.25s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

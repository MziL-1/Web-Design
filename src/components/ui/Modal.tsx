"use client";

import { useEffect, useRef } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className={`fixed inset-0 z-50 m-auto max-h-[90vh] w-full ${sizeClasses[size]} rounded-lg bg-white p-6 shadow-xl backdrop:bg-black/50 sm:max-h-[85vh]`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 id="modal-title" className="text-xl font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-neutral-muted hover:bg-slate-100 hover:text-neutral"
          aria-label="关闭"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {children}
    </dialog>
  );
}

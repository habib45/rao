"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/app/admin/_lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Dialog({ open, onClose, children, className, title }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        // jsdom / non-browser environments lack HTMLDialogElement#showModal.
        // Mark the dialog as open so consumers can still inspect it.
        (dialog as HTMLDialogElement & { open: boolean }).open = true;
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        (dialog as HTMLDialogElement & { open: boolean }).open = false;
      }
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "m-auto w-full max-w-lg rounded-xl border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted hover:bg-surface hover:text-foreground"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}

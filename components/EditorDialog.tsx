"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function EditorDialog({
  titleId, busy = false, compact = false, onClose, children,
}: {
  titleId: string;
  busy?: boolean;
  compact?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const focused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (focused instanceof HTMLElement) focused.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`editor-dialog ${compact ? "compact-dialog" : ""}`}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (!busy && event.target === event.currentTarget &&
          (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom)) onClose();
      }}
    >
      {children}
    </dialog>
  );
}

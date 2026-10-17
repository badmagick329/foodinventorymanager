"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function ConfirmationModal({
  title,
  children,
  confirmLabel,
  pendingLabel,
  confirmVariant = "default",
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  confirmVariant?: ButtonProps["variant"];
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const trigger = document.activeElement;
    return () => {
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  useEffect(() => {
    // Keep focus in the modal while both controls are disabled. Otherwise start
    // on Cancel so an incidental Enter cannot apply an inventory change.
    (busy ? dialogRef.current : cancelRef.current)?.focus();
  }, [busy]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={busy}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            if (!busy) onCancel();
          } else if (event.key === "Tab") {
            // These are the modal's only two controls; keep focus off the page.
            event.preventDefault();
            if (!busy) {
              const next =
                document.activeElement === cancelRef.current
                  ? confirmRef.current
                  : cancelRef.current;
              next?.focus();
            }
          }
        }}
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-muted-foreground">
          {children}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

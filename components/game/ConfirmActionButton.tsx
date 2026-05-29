"use client";

import { useRef, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

export function ConfirmActionButton({
  serverAction,
  hiddenInputs,
  confirmTitle,
  confirmMessage,
  confirmText,
  cancelText,
  buttonLabel,
  buttonClassName,
  disabled,
}: {
  serverAction: (formData: FormData) => void;
  hiddenInputs: Record<string, string>;
  confirmTitle: string;
  confirmMessage: string;
  confirmText: string;
  cancelText: string;
  buttonLabel: string;
  buttonClassName?: string;
  disabled?: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowConfirm(true)}
        className={
          buttonClassName ??
          "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed"
        }
      >
        {buttonLabel}
      </button>

      <form ref={formRef} action={serverAction} className="hidden">
        {Object.entries(hiddenInputs).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      </form>

      <ConfirmModal
        open={showConfirm}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        cancelText={cancelText}
        onConfirm={() => {
          setShowConfirm(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

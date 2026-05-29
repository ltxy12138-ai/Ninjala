"use client";

import { useState } from "react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-[24px] border border-[#d9e7d8] bg-white p-6 shadow-[0_16px_40px_rgba(24,58,42,0.12)]">
        <h3 className="text-lg font-semibold text-[#183a2a]">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#55715f]">{message}</p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-[#eef3ee] px-4 py-3 text-sm font-semibold text-[#4f6d59] transition hover:bg-[#e4ece4]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#8c372b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6d2a21]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

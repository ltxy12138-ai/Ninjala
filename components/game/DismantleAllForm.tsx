"use client";

import { useRef, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

export function DismantleAllForm({
  serverAction,
  tab,
  page,
  locale,
}: {
  serverAction: (formData: FormData) => void;
  tab: string;
  page: number;
  locale: "zh" | "en";
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-md bg-[#efe6df] px-1.5 py-0.5 text-[10px] font-semibold text-[#7a4b2a] transition hover:bg-[#e7dacd] disabled:cursor-not-allowed disabled:bg-[#f5efea] disabled:text-[#b79d8b]"
      >
        {locale === "zh" ? "一键分解" : "Dismantle All"}
      </button>

      <form ref={formRef} action={serverAction} className="hidden">
        <input type="hidden" name="tab" value={tab} />
        <input type="hidden" name="page" value={page} />
      </form>

      <ConfirmModal
        open={showConfirm}
        title={locale === "zh" ? "一键分解" : "Dismantle All"}
        message={
          locale === "zh"
            ? "确定一键分解所有未装备且未锁定的装备吗？此操作不可撤销。"
            : "Dismantle all unequipped and unlocked gear? This cannot be undone."
        }
        confirmText={locale === "zh" ? "确定分解" : "Dismantle"}
        cancelText={locale === "zh" ? "取消" : "Cancel"}
        onConfirm={() => {
          setShowConfirm(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

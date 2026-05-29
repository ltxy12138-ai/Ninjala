"use client";

export function DismantleResultModal({
  open,
  count,
  locale,
  onClose,
}: {
  open: boolean;
  count: number;
  locale: "zh" | "en";
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-[24px] border border-[#d9e7d8] bg-white p-6 shadow-[0_16px_40px_rgba(24,58,42,0.12)]">
        <h3 className="text-lg font-semibold text-[#1f4936]">
          {locale === "zh" ? "分解完成" : "Dismantle Complete"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#55715f]">
          {locale === "zh"
            ? `共分解了 ${count} 件装备，回收材料已放入仓库。`
            : `${count} items dismantled, materials returned to stash.`}
        </p>
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#204b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a]"
          >
            {locale === "zh" ? "知道了" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}

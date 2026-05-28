import Link from "next/link";
import type { ReactNode } from "react";

type ActionModalProps = {
  title: string;
  closeHref: string;
  closeLabel: string;
  children: ReactNode;
};

export function ActionModal({
  title,
  closeHref,
  closeLabel,
  children,
}: ActionModalProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-end justify-center bg-[#16351f]/24 p-4 sm:items-center">
      <div className="pointer-events-auto w-full max-w-md rounded-[28px] border border-[#d9e7d8] bg-white p-5 shadow-[0_22px_70px_rgba(24,58,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-[#183a2a]">{title}</h2>
          <Link
            href={closeHref}
            scroll={false}
            className="rounded-full bg-[#eef3ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6d59] transition hover:bg-[#e2ebe1]"
          >
            {closeLabel}
          </Link>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-6 text-[#55715f]">
          {children}
        </div>
      </div>
    </div>
  );
}

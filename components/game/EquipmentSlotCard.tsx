import type { ReactNode } from "react";

import type { Locale } from "@/lib/i18n";
import { formatSlotLabel, type ItemSlot } from "@/lib/game/types";

type EquipmentSlotCardProps = {
  slot: ItemSlot;
  children: ReactNode;
  locale: Locale;
};

export function EquipmentSlotCard({
  slot,
  children,
  locale,
}: EquipmentSlotCardProps) {
  return (
    <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#72906f]">
        {formatSlotLabel(slot, locale)}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

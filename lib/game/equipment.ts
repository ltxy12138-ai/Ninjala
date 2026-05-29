import { calculatePower, sumEquipmentStats } from "@/lib/game/power";
import {
  itemSlots,
  type EquipmentStats,
  type ItemSlot,
} from "@/lib/game/types";

export const slotCapacities: Record<ItemSlot, number> = {
  weapon: 1,
  helmet: 1,
  armor: 1,
  boots: 1,
  bracer: 1,
  amulet: 1,
  ring: 2,
};

export type EquippedItemSnapshot = Partial<EquipmentStats> & {
  id: string;
  slot: ItemSlot;
  equippedAt: Date | null;
  equipSlotIndex: number | null;
};

export type InventorySortableItemSnapshot = EquippedItemSnapshot & {
  isLocked: boolean;
  enhancementLevel: number;
  createdAt: Date;
};

export function getSlotCapacity(slot: ItemSlot) {
  return slotCapacities[slot];
}

export function isItemEquipped(item: {
  equippedAt: Date | null;
  equipSlotIndex: number | null;
}) {
  return item.equippedAt !== null && item.equipSlotIndex !== null;
}

export function getEquippedItemsBySlot(items: EquippedItemSnapshot[]) {
  const result = new Map<ItemSlot, EquippedItemSnapshot[]>();

  for (const slot of itemSlots) {
    result.set(slot, []);
  }

  for (const item of items) {
    if (isItemEquipped(item)) {
      result.get(item.slot)?.push(item);
    }
  }

  for (const slot of itemSlots) {
    result.get(slot)?.sort((left, right) => {
      const leftIndex = left.equipSlotIndex ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = right.equipSlotIndex ?? Number.MAX_SAFE_INTEGER;

      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }

      return left.id.localeCompare(right.id);
    });
  }

  return result;
}

export function getFirstFreeEquipSlotIndex(
  items: EquippedItemSnapshot[],
  slot: ItemSlot,
) {
  const usedIndexes = new Set(
    getEquippedItemsBySlot(items)
      .get(slot)
      ?.map((item) => item.equipSlotIndex)
      .filter((index): index is number => index !== null) ?? [],
  );

  for (let index = 0; index < getSlotCapacity(slot); index += 1) {
    if (!usedIndexes.has(index)) {
      return index;
    }
  }

  return null;
}

export function calculatePowerFromEquippedItems(items: EquippedItemSnapshot[]) {
  const equippedItems = items.filter(isItemEquipped);
  const totalStats = sumEquipmentStats(equippedItems);

  return {
    totalStats,
    power: calculatePower(totalStats),
  };
}

export function compareItemsForBestChoice(
  left: EquippedItemSnapshot,
  right: EquippedItemSnapshot,
) {
  const leftPower = calculatePower(left);
  const rightPower = calculatePower(right);

  if (leftPower !== rightPower) {
    return rightPower - leftPower;
  }

  if (isItemEquipped(left) && !isItemEquipped(right)) {
    return -1;
  }

  if (!isItemEquipped(left) && isItemEquipped(right)) {
    return 1;
  }

  return left.id.localeCompare(right.id);
}

export function chooseBestItemsBySlot(items: EquippedItemSnapshot[]) {
  const result = new Map<ItemSlot, EquippedItemSnapshot[]>();

  for (const slot of itemSlots) {
    const slotItems = items
      .filter((item) => item.slot === slot)
      .sort(compareItemsForBestChoice)
      .slice(0, getSlotCapacity(slot));

    result.set(slot, slotItems);
  }

  return result;
}

export function flattenBestItemsBySlot(
  selectedItems: Map<ItemSlot, EquippedItemSnapshot[]>,
) {
  return itemSlots.flatMap((slot) => selectedItems.get(slot) ?? []);
}

export function compareInventoryItems(
  left: InventorySortableItemSnapshot,
  right: InventorySortableItemSnapshot,
) {
  const leftEquipped = isItemEquipped(left);
  const rightEquipped = isItemEquipped(right);

  if (leftEquipped !== rightEquipped) {
    return leftEquipped ? -1 : 1;
  }

  if (left.isLocked !== right.isLocked) {
    return left.isLocked ? -1 : 1;
  }

  if (leftEquipped && rightEquipped) {
    const leftSlotOrder = itemSlots.indexOf(left.slot);
    const rightSlotOrder = itemSlots.indexOf(right.slot);

    if (leftSlotOrder !== rightSlotOrder) {
      return leftSlotOrder - rightSlotOrder;
    }

    const leftIndex = left.equipSlotIndex ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = right.equipSlotIndex ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }
  }

  if (left.enhancementLevel !== right.enhancementLevel) {
    return right.enhancementLevel - left.enhancementLevel;
  }

  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return right.createdAt.getTime() - left.createdAt.getTime();
  }

  return left.id.localeCompare(right.id);
}

export function sortInventoryItems<TItem extends InventorySortableItemSnapshot>(
  items: TItem[],
) {
  return [...items].sort(compareInventoryItems);
}

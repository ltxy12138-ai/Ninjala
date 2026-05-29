import { describe, expect, it } from "vitest";

import { affixDefinitions } from "@/data/affixes";
import { bossDefinitions } from "@/data/bosses";
import { itemBaseDefinitions } from "@/data/item-bases";
import { materialDefinitions } from "@/data/materials";
import { regionDefinitions } from "@/data/regions";

describe("content targets", () => {
  it("keeps phase-two region, boss, and material counts at target", () => {
    expect(regionDefinitions).toHaveLength(10);
    expect(bossDefinitions).toHaveLength(10);
    expect(materialDefinitions.length).toBeGreaterThanOrEqual(10);
  });

  it("keeps expanded item base and affix counts at target", () => {
    expect(itemBaseDefinitions.length).toBeGreaterThanOrEqual(55);
    expect(affixDefinitions.length).toBeGreaterThanOrEqual(30);
  });
});

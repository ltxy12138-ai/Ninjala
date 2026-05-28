import { describe, expect, it } from "vitest";

import { affixDefinitions } from "@/data/affixes";
import { bossDefinitions } from "@/data/bosses";
import { itemBaseDefinitions } from "@/data/item-bases";
import { materialDefinitions } from "@/data/materials";
import { regionDefinitions } from "@/data/regions";

describe("content targets", () => {
  it("keeps V1 region, boss, and material counts at target", () => {
    expect(regionDefinitions).toHaveLength(5);
    expect(bossDefinitions).toHaveLength(5);
    expect(materialDefinitions.length).toBeGreaterThanOrEqual(5);
  });

  it("keeps V1 item base and affix counts at target", () => {
    expect(itemBaseDefinitions.length).toBeGreaterThanOrEqual(30);
    expect(affixDefinitions.length).toBeGreaterThanOrEqual(20);
  });
});

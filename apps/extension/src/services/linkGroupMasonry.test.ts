import { describe, expect, it } from "vitest";
import {
  linkGroupRowSpan,
  packLinkGroups,
  parseLinkGroupColumnCount,
  stackLinkGroups
} from "@/services/linkGroupMasonry";

describe("link group masonry", () => {
  it("reserves the row gap under each group", () => {
    expect(linkGroupRowSpan(160, 42)).toBe(202);
  });

  it("rounds partial pixels up so the next group does not overlap", () => {
    expect(linkGroupRowSpan(160.2, 37.4)).toBe(198);
  });

  it("keeps a one-pixel span when the group has no measurable height", () => {
    expect(linkGroupRowSpan(0, 0)).toBe(1);
    expect(linkGroupRowSpan(Number.NaN, Number.NaN)).toBe(1);
  });

  it("puts the first group in the first column and fills the shortest column", () => {
    expect(packLinkGroups([200, 80, 300, 100], 3, 42).map((item) => item.column)).toEqual([1, 2, 3, 2]);
  });

  it("breaks column ties toward the left", () => {
    expect(packLinkGroups([120, 120, 120, 40], 3, 0).map((item) => item.column)).toEqual([1, 2, 3, 1]);
  });

  it("reads the column count declared by the layout", () => {
    expect(parseLinkGroupColumnCount("3")).toBe(3);
    expect(parseLinkGroupColumnCount("1")).toBe(1);
    expect(parseLinkGroupColumnCount("")).toBe(1);
  });

  it("keeps each group in its column and only pushes the ones below a grown group", () => {
    const columns = packLinkGroups([100, 100, 100, 100], 3, 0).map((item) => item.column);
    expect(columns).toEqual([1, 2, 3, 1]);

    // The first group grows by 40px: the fourth (same column) moves down, the others stay.
    const grown = stackLinkGroups([140, 100, 100, 100], columns, 0);
    expect(grown.map((item) => item.column)).toEqual([1, 2, 3, 1]);
    expect(grown.map((item) => item.rowStart)).toEqual([1, 1, 1, 141]);

    // A full pack would have re-sorted the fourth group into the shortest column instead.
    expect(packLinkGroups([140, 100, 100, 100], 3, 0).map((item) => item.column)).toEqual([1, 2, 3, 2]);
  });

  it("stacks every group when there is only one column", () => {
    const placed = packLinkGroups([100, 50], 1, 24);

    expect(placed.map((item) => item.column)).toEqual([1, 1]);
    expect(placed[1]?.rowStart).toBe((placed[0]?.rowSpan ?? 0) + 1);
  });
});

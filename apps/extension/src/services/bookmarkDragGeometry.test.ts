import { describe, expect, it } from "vitest";
import {
  clampIndex,
  locateGroup,
  reorderIds,
  resolveGroupInsertion,
  resolveRowInsertion,
  simulateDraggedGroupRect,
  type BookmarkDragGeometry,
  type RowBox
} from "@/services/bookmarkDragGeometry";

const rows = (...tops: number[]): RowBox[] =>
  tops.map((top, index) => ({ id: `r${index + 1}`, top, bottom: top + 40 }));

const board = (overrides: Partial<BookmarkDragGeometry> = {}): BookmarkDragGeometry => ({
  groups: [],
  layout: {
    before: [],
    groups: ["a", "b", "c", "d"].map((id) => ({ id, height: 100 })),
    after: []
  },
  grid: { columnCount: 3, rowGap: 0, columnGap: 10, columnWidth: 100, originLeft: 0, originTop: 0 },
  rowHeight: 48,
  ...overrides
});

describe("reorderIds", () => {
  it("moves one id to the requested slot", () => {
    expect(reorderIds(["a", "b", "c", "d"], "d", 1)).toEqual(["a", "d", "b", "c"]);
    expect(reorderIds(["a", "b", "c", "d"], "a", 3)).toEqual(["b", "c", "d", "a"]);
  });

  it("clamps out-of-range slots and ignores unknown ids", () => {
    expect(reorderIds(["a", "b"], "a", 99)).toEqual(["b", "a"]);
    expect(reorderIds(["a", "b"], "x", 0)).toEqual(["a", "b"]);
    expect(clampIndex(-3, 2)).toBe(0);
  });
});

describe("resolveRowInsertion", () => {
  it("opens the gap before the row whose upper half holds the pointer", () => {
    expect(resolveRowInsertion(rows(0, 42, 84), null, 50, null)).toBe(1);
    expect(resolveRowInsertion(rows(0, 42, 84), null, 5, null)).toBe(0);
  });

  it("appends below the last row and into an empty group", () => {
    expect(resolveRowInsertion(rows(0, 42, 84), null, 400, null)).toBe(3);
    expect(resolveRowInsertion([], null, 10, null)).toBe(0);
  });

  it("counts positions without the dragged row", () => {
    // r2 is being dragged: the remaining rows are r1 and r3, so the end is index 2.
    expect(resolveRowInsertion(rows(0, 42, 84), "r2", 400, null)).toBe(2);
    expect(resolveRowInsertion(rows(0, 42, 84), "r2", 70, null)).toBe(1);
  });

  it("keeps the previous slot while the pointer hovers on a row boundary", () => {
    // 62 is the middle of r2; coming from below the gap should stay at index 2.
    expect(resolveRowInsertion(rows(0, 42, 84), null, 60, 2)).toBe(2);
    expect(resolveRowInsertion(rows(0, 42, 84), null, 60, null)).toBe(1);
  });
});

describe("locateGroup", () => {
  it("returns the box that contains the point and null in the gaps", () => {
    const geometry = board({
      groups: [
        { id: "a", left: 0, top: 0, right: 100, bottom: 100, rows: [] },
        { id: null, left: 110, top: 0, right: 210, bottom: 100, rows: [] }
      ]
    });

    expect(locateGroup(geometry, { x: 50, y: 50 })?.id).toBe("a");
    expect(locateGroup(geometry, { x: 150, y: 50 })?.id).toBeNull();
    expect(locateGroup(geometry, { x: 105, y: 50 })).toBeNull();
  });
});

describe("simulateDraggedGroupRect", () => {
  it("follows the masonry packing for each candidate slot", () => {
    const geometry = board();

    expect(simulateDraggedGroupRect(geometry, "d", 0)).toMatchObject({ left: 0, top: 0 });
    expect(simulateDraggedGroupRect(geometry, "d", 1)).toMatchObject({ left: 110, top: 0 });
    expect(simulateDraggedGroupRect(geometry, "d", 2)).toMatchObject({ left: 220, top: 0 });
    expect(simulateDraggedGroupRect(geometry, "d", 3)).toMatchObject({ left: 0, top: 100 });
  });

  it("accounts for fixed cards that precede the groups", () => {
    const geometry = board({
      layout: { before: [300], groups: [{ id: "a", height: 100 }, { id: "b", height: 100 }], after: [] }
    });

    // The 300px todo card takes column 1, so the first group lands in column 2.
    expect(simulateDraggedGroupRect(geometry, "a", 0)).toMatchObject({ left: 110, top: 0 });
  });

  it("returns null for an unknown group", () => {
    expect(simulateDraggedGroupRect(board(), "zzz", 0)).toBeNull();
  });
});

describe("resolveGroupInsertion", () => {
  it("chooses the slot whose layout lands closest to the carried card", () => {
    expect(resolveGroupInsertion(board(), "d", { x: 160, y: 50 }, 3)).toBe(1);
    expect(resolveGroupInsertion(board(), "d", { x: 270, y: 50 }, 0)).toBe(2);
  });

  it("holds the current slot until another one is clearly closer", () => {
    // Slot 0 centre is (50, 50) and slot 1 centre is (160, 50); (110, 50) is only slightly nearer slot 1.
    expect(resolveGroupInsertion(board(), "d", { x: 110, y: 50 }, 0)).toBe(0);
    expect(resolveGroupInsertion(board(), "d", { x: 160, y: 50 }, 0)).toBe(1);
  });
});

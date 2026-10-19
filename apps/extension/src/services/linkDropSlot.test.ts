import { describe, expect, it } from "vitest";
import {
  insertionIndexForSlot,
  resolveAnchoredDropSlot,
  resolveLinkDropSlot,
  sameGroupInsertionIndex,
  type LinkDropRow
} from "./linkDropSlot";

const rows: LinkDropRow[] = [
  { id: "a", top: 0, bottom: 40 },
  { id: "b", top: 42, bottom: 82 },
  { id: "c", top: 84, bottom: 124 }
];

describe("resolveLinkDropSlot", () => {
  it("keeps one insertion slot from the lower half of a row through the gap into the next row", () => {
    const lowerHalf = resolveLinkDropSlot(rows, 70);
    const gap = resolveLinkDropSlot(rows, 83, lowerHalf);
    const upperHalf = resolveLinkDropSlot(rows, 90, gap);

    expect(lowerHalf).toEqual({ linkId: "c", placement: "before" });
    expect(gap).toBe(lowerHalf);
    expect(upperHalf).toBe(lowerHalf);
  });

  it("uses the top half of a row as the slot before that row", () => {
    expect(resolveLinkDropSlot(rows, 50)).toEqual({ linkId: "b", placement: "before" });
  });

  it("places the pointer below the list after the last row", () => {
    expect(resolveLinkDropSlot(rows, 200)).toEqual({ linkId: "c", placement: "after" });
  });

  it("holds the current slot while the pointer jitters around a row midpoint", () => {
    const previous = resolveLinkDropSlot(rows, 50);
    const jitter = resolveLinkDropSlot(rows, 64, previous);

    expect(previous).toEqual({ linkId: "b", placement: "before" });
    expect(jitter).toBe(previous);
  });

  it("moves to the next slot after the pointer passes the midpoint band", () => {
    const previous = resolveLinkDropSlot(rows, 50);

    expect(resolveLinkDropSlot(rows, 78, previous)).toEqual({ linkId: "c", placement: "before" });
  });

  it("ignores a one-pixel jitter just past a row midpoint", () => {
    const previous = resolveLinkDropSlot(rows, 50);

    expect(resolveLinkDropSlot(rows, 63, previous)).toBe(previous);
  });
});

describe("insertionIndexForSlot", () => {
  const ids = ["a", "b", "c"];

  it("inserts before the anchored link", () => {
    expect(insertionIndexForSlot(ids, { linkId: "c", placement: "before" })).toBe(2);
  });

  it("appends after the last link", () => {
    expect(insertionIndexForSlot(ids, { linkId: "c", placement: "after" })).toBe(3);
  });
});

describe("sameGroupInsertionIndex", () => {
  const ids = ["a", "b", "c", "d"];

  it("moves the first link to just before the last link", () => {
    expect(sameGroupInsertionIndex(ids, "a", { linkId: "d", placement: "before" })).toBe(2);
  });

  it("moves the first link to the end", () => {
    expect(sameGroupInsertionIndex(ids, "a", { linkId: "d", placement: "after" })).toBe(3);
  });

  it("leaves the link where it already is", () => {
    expect(sameGroupInsertionIndex(ids, "a", { linkId: "b", placement: "before" })).toBeNull();
  });
});

describe("resolveAnchoredDropSlot", () => {
  const ids = ["a", "b", "c"];
  const card = { top: 100, bottom: 300 };

  it("uses the same slot for the bottom of one group and the top of the next", () => {
    const fromBottom = resolveAnchoredDropSlot(ids, "b", 260, card);
    const fromTop = resolveAnchoredDropSlot(ids, "c", 330, { top: 320, bottom: 500 }, fromBottom);

    expect(fromBottom).toEqual({ id: "c", placement: "before" });
    expect(fromTop).toBe(fromBottom);
  });

  it("keeps the current slot while the pointer jitters around a group midpoint", () => {
    const previous = resolveAnchoredDropSlot(ids, "b", 140, card);
    const jitter = resolveAnchoredDropSlot(ids, "b", 204, card, previous);

    expect(previous).toEqual({ id: "b", placement: "before" });
    expect(jitter).toBe(previous);
  });

  it("moves past the midpoint band", () => {
    const previous = resolveAnchoredDropSlot(ids, "b", 140, card);

    expect(resolveAnchoredDropSlot(ids, "b", 230, card, previous)).toEqual({
      id: "c",
      placement: "before"
    });
  });
});

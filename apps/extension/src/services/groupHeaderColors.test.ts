import { describe, expect, it } from "vitest";
import {
  GROUP_HEADER_COLOR_COUNT,
  chooseGroupColorIndex,
  formatGroupColorIndex,
  groupHeaderTone,
  groupAccentDistance,
  parseGroupColorIndex,
  resolveGroupColorIndex
} from "@/services/groupHeaderColors";
import { groupHeaderText } from "@/services/groupHeaderPalette";

const channel = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);

const luminance = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = channel(((value >> 16) & 255) / 255);
  const green = channel(((value >> 8) & 255) / 255);
  const blue = channel((value & 255) / 255);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrast = (background: string, text: string) => {
  const left = luminance(background);
  const right = luminance(text);
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
};

describe("group header colors", () => {
  it("keeps a perceptual distance between every pair of base color markers", () => {
    for (let left = 0; left < 10; left += 1) {
      for (let right = left + 1; right < 10; right += 1) {
        expect(groupAccentDistance(left, right), `${left} and ${right}`).toBeGreaterThanOrEqual(0.065);
      }
    }
  });
  it("keeps 50 distinct solid headers and separate light and dark previews", () => {
    for (const mode of ["light", "dark"] as const) {
      const tops = Array.from({ length: GROUP_HEADER_COLOR_COUNT }, (_, index) => groupHeaderTone(index, mode).top);
      expect(new Set(tops).size).toBe(GROUP_HEADER_COLOR_COUNT);
    }

    const light = Array.from({ length: GROUP_HEADER_COLOR_COUNT }, (_, index) => groupHeaderTone(index, "light").top);
    const dark = Array.from({ length: GROUP_HEADER_COLOR_COUNT }, (_, index) => groupHeaderTone(index, "dark").top);
    expect(light).not.toEqual(dark);
  });

  it("keeps bright solid fills and readable text in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const text = groupHeaderText[mode];

      for (let index = 0; index < GROUP_HEADER_COLOR_COUNT; index += 1) {
        const tone = groupHeaderTone(index, mode);
        expect(contrast(tone.top, text)).toBeGreaterThanOrEqual(4.5);
        expect(luminance(tone.top)).toBeGreaterThan(0.4);
      }
    }
  });

  it("assigns unused colors far apart, then repeats only after the palette is full", () => {
    const used: number[] = [];

    for (let count = 0; count < GROUP_HEADER_COLOR_COUNT; count += 1) {
      const next = chooseGroupColorIndex(used);
      expect(used).not.toContain(next);
      used.push(next);
    }

    expect(new Set(used).size).toBe(GROUP_HEADER_COLOR_COUNT);
    expect(new Set(used.slice(0, 10).map((index) => index % 10)).size).toBe(10);
    expect(used.slice(0, 10).every((index) => index < 10)).toBe(true);
    expect(chooseGroupColorIndex(used)).toBeGreaterThanOrEqual(0);
    expect(chooseGroupColorIndex(used)).toBeLessThan(GROUP_HEADER_COLOR_COUNT);
  });

  it("counts manually selected shades as the same family when allocating new groups", () => {
    const used = [10, 20, 30];
    for (let count = 0; count < 9; count += 1) {
      const next = chooseGroupColorIndex(used);
      expect(next % 10).not.toBe(0);
      expect(used.map((index) => index % 10)).not.toContain(next % 10);
      used.push(next);
    }
  });

  it("prefers the most perceptually distant hue rather than palette order", () => {
    const next = chooseGroupColorIndex([0]);
    const distances = Array.from({ length: 10 }, (_, index) => groupAccentDistance(0, index));
    expect(groupAccentDistance(0, next)).toBe(Math.max(...distances));
  });

  it("separates successive groups even after every swatch has been used", () => {
    const used = Array.from({ length: GROUP_HEADER_COLOR_COUNT }, (_, index) => index);
    for (let count = 0; count < 20; count += 1) {
      const next = chooseGroupColorIndex(used);
      expect(used.slice(-3).map((index) => index % 10)).not.toContain(next % 10);
      used.push(next);
    }
  });

  it("ignores invalid saved indexes and returns a stable allocation", () => {
    expect(chooseGroupColorIndex([-1, 50, NaN, 1.5])).toBe(0);
    expect(chooseGroupColorIndex([0, 5, -1, 50])).toBe(chooseGroupColorIndex([0, 5]));
  });

  it("stores a palette index and falls back for missing or unknown colors", () => {
    expect(formatGroupColorIndex(7)).toBe("palette:7");
    expect(parseGroupColorIndex("palette:7")).toBe(7);
    expect(parseGroupColorIndex("palette:50")).toBeUndefined();
    expect(parseGroupColorIndex("#713a45")).toBeUndefined();
    expect(resolveGroupColorIndex("palette:12", "group-a")).toBe(12);
    expect(resolveGroupColorIndex(undefined, "group-a")).toBe(resolveGroupColorIndex(undefined, "group-a"));
    expect(resolveGroupColorIndex(undefined, "group-a")).toBeGreaterThanOrEqual(0);
    expect(resolveGroupColorIndex(undefined, "group-a")).toBeLessThan(GROUP_HEADER_COLOR_COUNT);
    expect(groupHeaderTone(0, "dark").text).toBe(groupHeaderText.dark);
    expect(groupHeaderTone(0, "light").text).toBe(groupHeaderText.light);
    expect(groupHeaderTone(0, "dark").top).not.toBe(groupHeaderTone(0, "light").top);
  });
});

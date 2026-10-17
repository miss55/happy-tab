import {
  GROUP_HEADER_COLOR_COUNT,
  GROUP_HEADER_FAMILY_COUNT,
  groupHeaderAccents,
  groupHeaderScrim,
  groupHeaderStrength,
  groupHeaderText
} from "@/services/groupHeaderPalette";

export { GROUP_HEADER_COLOR_COUNT, GROUP_HEADER_FAMILY_COUNT };

export type GroupHeaderMode = keyof typeof groupHeaderText;

export interface GroupHeaderTone {
  accent: string;
  top: string;
  text: string;
}

const PALETTE_COLOR = /^palette:(\d{1,2})$/;

export const parseGroupColorIndex = (color?: string): number | undefined => {
  if (!color) {
    return undefined;
  }

  const match = PALETTE_COLOR.exec(color.trim());
  if (!match) {
    return undefined;
  }

  const index = Number(match[1]);
  if (!Number.isInteger(index) || index < 0 || index >= GROUP_HEADER_COLOR_COUNT) {
    return undefined;
  }

  return index;
};

export const formatGroupColorIndex = (index: number): string => {
  if (!Number.isInteger(index) || index < 0 || index >= GROUP_HEADER_COLOR_COUNT) {
    throw new Error("Group color is invalid.");
  }

  return `palette:${index}`;
};

const HUE_FAMILY_COUNT = GROUP_HEADER_FAMILY_COUNT;

// Compare perceived color, rather than the position of a swatch in the picker.
const toOklab = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
};

const accentLabs = groupHeaderAccents.map(toOklab);
export const groupAccentDistance = (left: number, right: number) =>
  Math.hypot(...accentLabs[left % HUE_FAMILY_COUNT].map(
    (channel, index) => channel - accentLabs[right % HUE_FAMILY_COUNT][index]
  ));

export const chooseGroupColorIndex = (usedIndexes: readonly number[]): number => {
  const counts = Array.from({ length: GROUP_HEADER_COLOR_COUNT }, () => 0);

  for (const index of usedIndexes) {
    if (Number.isInteger(index) && index >= 0 && index < GROUP_HEADER_COLOR_COUNT) {
      counts[index] += 1;
    }
  }

  const leastUsed = Math.min(...counts);
  let candidates = counts.flatMap((count, index) => (count === leastUsed ? [index] : []));
  const used = usedIndexes.filter(
    (index): index is number => Number.isInteger(index) && index >= 0 && index < GROUP_HEADER_COLOR_COUNT
  );

  if (used.length === 0) {
    return candidates[0] ?? 0;
  }

  // Use every hue family before introducing subtle shade variations. This also
  // works when existing groups have manually selected lighter swatches.
  const familyCounts = Array.from({ length: HUE_FAMILY_COUNT }, () => 0);
  for (const index of used) familyCounts[index % HUE_FAMILY_COUNT] += 1;
  const leastUsedFamily = Math.min(...candidates.map((index) => familyCounts[index % HUE_FAMILY_COUNT]));
  candidates = candidates.filter((index) => familyCounts[index % HUE_FAMILY_COUNT] === leastUsedFamily);
  const score = (candidate: number) => {
    const otherFamilies = used.filter((index) => index % HUE_FAMILY_COUNT !== candidate % HUE_FAMILY_COUNT);
    const globalDistance = otherFamilies.length ? Math.min(...otherFamilies.map((index) => groupAccentDistance(candidate, index))) : 0;
    // Once colors must repeat, avoid the most recently allocated nearby groups.
    const nearbyDistance = Math.min(...used.slice(-3).map((index) => groupAccentDistance(candidate, index)));
    return globalDistance + nearbyDistance * 0.5;
  };

  return candidates.reduce((best, candidate) => {
    return score(candidate) > score(best) ? candidate : best;
  }, candidates[0] ?? 0);
};

export const fallbackGroupColorIndex = (groupId: string): number => {
  let hash = 0;

  for (const char of groupId) {
    hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  }

  return hash % GROUP_HEADER_COLOR_COUNT;
};

export const resolveGroupColorIndex = (color: string | undefined, groupId: string): number =>
  parseGroupColorIndex(color) ?? fallbackGroupColorIndex(groupId);

const parseHex = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
};

const mixChannels = (color: readonly number[], base: readonly number[], amount: number) =>
  color.map((channel, index) => Math.round(channel * amount + base[index] * (1 - amount)));

const toHex = (channels: number[]) =>
  `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;

export const groupHeaderTone = (index: number, mode: GroupHeaderMode): GroupHeaderTone => {
  const safeIndex =
    ((index % GROUP_HEADER_COLOR_COUNT) + GROUP_HEADER_COLOR_COUNT) % GROUP_HEADER_COLOR_COUNT;
  const accent = groupHeaderAccents[safeIndex % HUE_FAMILY_COUNT];
  const strong = groupHeaderStrength[mode][Math.floor(safeIndex / HUE_FAMILY_COUNT)];
  const scrim = groupHeaderScrim[mode];
  const accentChannels = parseHex(accent);

  return {
    accent,
    top: toHex(mixChannels(accentChannels, scrim, strong)),
    text: groupHeaderText[mode]
  };
};

export const groupHeaderStyle = (tone: GroupHeaderTone): Record<string, string> => ({
  "--group-header-background": tone.top,
  "--group-header-text": tone.text
});

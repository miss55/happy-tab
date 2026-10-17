export const GROUP_HEADER_COLOR_COUNT = 50;
export const GROUP_HEADER_FAMILY_COUNT = 10;

// Categorical colors: avoid several neighboring cyan/blue/purple swatches.
// Palette indexes remain compatible with stored groups and backups.
export const groupHeaderAccents = [
  "#FF8AA0",
  "#F59B46",
  "#FFD83D",
  "#51C982",
  "#24C7C8",
  "#53BDF4",
  "#7B9DF6",
  "#B4D64A",
  "#C69DF2",
  "#F07CDB"
] as const;

export const groupHeaderText = {
  light: "#111827",
  dark: "#111827"
} as const;

export const groupHeaderStrength = {
  light: [0.82, 0.70, 0.58, 0.46, 0.34],
  dark: [0.74, 0.64, 0.54, 0.44, 0.34]
} as const;

export const groupHeaderScrim = {
  light: [255, 255, 255],
  dark: [255, 255, 255]
} as const;

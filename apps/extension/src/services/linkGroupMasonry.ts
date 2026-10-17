export type LinkGroupPlacement = {
  column: number;
  rowStart: number;
  rowSpan: number;
};

const MASONRY_GAP_PROPERTY = "--link-group-masonry-gap";
const PLACEMENT_ATTRIBUTE = "data-masonry-placement";

export const linkGroupRowSpan = (height: number, rowGap: number) => {
  const safeHeight = Number.isFinite(height) ? Math.max(0, height) : 0;
  const safeGap = Number.isFinite(rowGap) ? Math.max(0, rowGap) : 0;
  return Math.max(1, Math.ceil(safeHeight + safeGap));
};

export const packLinkGroups = (
  heights: number[],
  columnCount: number,
  rowGap: number
): LinkGroupPlacement[] => {
  const columns = Array.from({ length: Math.max(1, Math.floor(columnCount) || 1) }, () => 0);

  return heights.map((height) => {
    let columnIndex = 0;

    for (let index = 1; index < columns.length; index += 1) {
      if (columns[index] < columns[columnIndex]) {
        columnIndex = index;
      }
    }

    const rowSpan = linkGroupRowSpan(height, rowGap);
    const rowStart = columns[columnIndex] + 1;
    columns[columnIndex] += rowSpan;

    return {
      column: columnIndex + 1,
      rowStart,
      rowSpan
    };
  });
};

const linkGroupElements = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>(":scope > .link-group")];

export const parseLinkGroupColumnCount = (value: string) => {
  const count = Number.parseInt(value, 10);
  return Number.isFinite(count) && count > 0 ? count : 1;
};

export const readLinkGroupColumnCount = (container: HTMLElement) =>
  parseLinkGroupColumnCount(getComputedStyle(container).getPropertyValue("--link-group-column-count"));

export const readLinkGroupMasonryGap = (container: HTMLElement) => {
  const value = Number.parseFloat(getComputedStyle(container).getPropertyValue(MASONRY_GAP_PROPERTY));
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

export const applyLinkGroupMasonry = (container: HTMLElement) => {
  const groups = linkGroupElements(container);
  const placements = packLinkGroups(
    groups.map((group) => group.offsetHeight),
    readLinkGroupColumnCount(container),
    readLinkGroupMasonryGap(container)
  );

  groups.forEach((group, index) => {
    const placement = placements[index];

    if (!placement) {
      return;
    }

    const signature = `${placement.column}:${placement.rowStart}:${placement.rowSpan}`;

    if (group.getAttribute(PLACEMENT_ATTRIBUTE) === signature) {
      return;
    }

    group.setAttribute(PLACEMENT_ATTRIBUTE, signature);
    group.style.gridColumn = String(placement.column);
    group.style.gridRow = `${placement.rowStart} / span ${placement.rowSpan}`;
  });
};

export type LinkGroupMasonryBinding = {
  refresh: () => void;
  disconnect: () => void;
};

export const bindLinkGroupMasonry = (
  container: HTMLElement,
  isPaused: () => boolean
): LinkGroupMasonryBinding => {
  let frame = 0;

  const layout = () => {
    frame = 0;

    if (isPaused()) {
      return;
    }

    applyLinkGroupMasonry(container);
  };

  const schedule = () => {
    if (frame) {
      return;
    }

    frame = requestAnimationFrame(layout);
  };

  const observer = new ResizeObserver(() => {
    schedule();
  });

  const observe = () => {
    observer.disconnect();
    observer.observe(container);

    for (const group of linkGroupElements(container)) {
      observer.observe(group);
    }
  };

  const refresh = () => {
    if (isPaused()) {
      return;
    }

    observe();
    applyLinkGroupMasonry(container);
  };

  refresh();

  return {
    refresh,
    disconnect: () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }

      observer.disconnect();
    }
  };
};

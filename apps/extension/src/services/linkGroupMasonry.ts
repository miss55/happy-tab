import { captureFlip, playFlip } from "@/services/flip";

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

/**
 * Re-stacks groups inside the columns they already occupy. Used while a bookmark
 * or tab is dragged into a group: the target grows, and only the groups below it
 * in the same column should move, instead of the whole board re-packing.
 */
export const stackLinkGroups = (
  heights: number[],
  columns: number[],
  rowGap: number
): LinkGroupPlacement[] => {
  const cursors = new Map<number, number>();

  return heights.map((height, index) => {
    const column = columns[index] ?? 1;
    const rowSpan = linkGroupRowSpan(height, rowGap);
    const rowStart = (cursors.get(column) ?? 0) + 1;
    cursors.set(column, rowStart - 1 + rowSpan);
    return { column, rowStart, rowSpan };
  });
};

export type LinkGroupMasonryMode = "pack" | "keep-columns";

const linkGroupElements = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>(":scope > .link-group")];

const readPlacedColumns = (groups: HTMLElement[], columnCount: number) => {
  const columns = groups.map((group) => {
    const column = Number.parseInt(group.getAttribute(PLACEMENT_ATTRIBUTE)?.split(":")[0] ?? "", 10);
    return Number.isFinite(column) && column >= 1 && column <= columnCount ? column : 0;
  });

  return columns.every((column) => column > 0) ? columns : null;
};

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

export const applyLinkGroupMasonry = (container: HTMLElement, mode: LinkGroupMasonryMode = "pack") => {
  const groups = linkGroupElements(container);
  const heights = groups.map((group) => group.offsetHeight);
  const columnCount = readLinkGroupColumnCount(container);
  const rowGap = readLinkGroupMasonryGap(container);
  const placedColumns = mode === "keep-columns" ? readPlacedColumns(groups, columnCount) : null;
  // A group without a previous column (first layout, new group) falls back to a full pack.
  const placements = placedColumns
    ? stackLinkGroups(heights, placedColumns, rowGap)
    : packLinkGroups(heights, columnCount, rowGap);
  const changes = groups.flatMap((group, index) => {
    const placement = placements[index];

    if (!placement) {
      return [];
    }

    const signature = `${placement.column}:${placement.rowStart}:${placement.rowSpan}`;
    const previous = group.getAttribute(PLACEMENT_ATTRIBUTE);
    return previous === signature ? [] : [{ group, placement, signature, isFirstLayout: !previous }];
  });
  const snapshot = captureFlip(changes.flatMap((change) => (change.isFirstLayout ? [] : [change.group])));

  for (const { group, placement, signature } of changes) {
    group.setAttribute(PLACEMENT_ATTRIBUTE, signature);
    group.style.gridColumn = String(placement.column);
    group.style.gridRow = `${placement.rowStart} / span ${placement.rowSpan}`;
  }

  playFlip(snapshot);
};

export type LinkGroupMasonryBinding = {
  refresh: () => void;
  disconnect: () => void;
};

export const bindLinkGroupMasonry = (
  container: HTMLElement,
  getMode: () => LinkGroupMasonryMode
): LinkGroupMasonryBinding => {
  let frame = 0;

  const layout = () => {
    frame = 0;
    applyLinkGroupMasonry(container, getMode());
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
    observe();
    applyLinkGroupMasonry(container, getMode());
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

import { cancelFlip } from "@/services/flip";
import { insertionIndexForSlot, resolveLinkDropSlot, type LinkDropSlot } from "@/services/linkDropSlot";
import {
  packLinkGroups,
  readLinkGroupColumnCount,
  readLinkGroupMasonryGap
} from "@/services/linkGroupMasonry";

/**
 * Geometry for live drag previews of link groups and links.
 *
 * Neighbours slide around while dragging, so hit-testing against their live
 * rectangles would feed back into the preview and flicker. Everything here is
 * measured once when the drag starts, relative to the groups container, and the
 * preview index is derived from that frozen snapshot plus the pointer.
 */

export type RowBox = { id: string; top: number; bottom: number };

export type GroupBox = {
  /** `null` for cards that are not link groups (todo list, "new group" card). */
  id: string | null;
  left: number;
  top: number;
  right: number;
  bottom: number;
  rows: RowBox[];
};

export type GroupGridGeometry = {
  columnCount: number;
  rowGap: number;
  columnGap: number;
  columnWidth: number;
  originLeft: number;
  originTop: number;
};

export type GroupLayout = {
  /** Heights of fixed cards that always sit before the link groups. */
  before: number[];
  groups: { id: string; height: number }[];
  /** Heights of fixed cards that always sit after the link groups. */
  after: number[];
};

export type BookmarkDragGeometry = {
  groups: GroupBox[];
  layout: GroupLayout;
  grid: GroupGridGeometry;
  /** Height of one saved-link row, used to size the placeholder that opens a gap. */
  rowHeight: number;
};

export type Point = { x: number; y: number };

const DEFAULT_ROW_HEIGHT = 48;
/** The current group slot is kept unless another one is clearly closer to the dragged card. */
const GROUP_SLOT_HYSTERESIS = 48;

export const clampIndex = (index: number, length: number) => Math.max(0, Math.min(index, length));

export const reorderIds = (ids: readonly string[], id: string, index: number) => {
  const from = ids.indexOf(id);

  if (from < 0) {
    return [...ids];
  }

  const next = [...ids];
  next.splice(from, 1);
  next.splice(clampIndex(index, next.length), 0, id);
  return next;
};

export const locateGroup = (geometry: BookmarkDragGeometry, point: Point): GroupBox | null =>
  geometry.groups.find(
    (box) => point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom
  ) ?? null;

const slotForInsertion = (rows: readonly RowBox[], index: number): LinkDropSlot =>
  index >= rows.length
    ? { linkId: rows[rows.length - 1]?.id ?? null, placement: "after" }
    : { linkId: rows[index]!.id, placement: "before" };

/**
 * Insertion index inside one group's links, counted without the dragged link so
 * it can be spliced in directly. `previousIndex` keeps the existing hysteresis
 * band so the gap does not flutter on a row boundary.
 */
export const resolveRowInsertion = (
  rows: readonly RowBox[],
  draggedId: string | null,
  y: number,
  previousIndex: number | null
) => {
  const others = rows.filter((row) => row.id !== draggedId);
  const previous = previousIndex === null ? null : slotForInsertion(others, previousIndex);
  const slot = resolveLinkDropSlot(others, y, previous);
  return insertionIndexForSlot(
    others.map((row) => row.id),
    slot
  );
};

type GroupRect = { left: number; top: number; width: number; height: number };

/** Lays the groups out exactly like the masonry does, with the dragged group inserted at `index`. */
export const simulateDraggedGroupRect = (
  geometry: BookmarkDragGeometry,
  draggedId: string,
  index: number
): GroupRect | null => {
  const { layout, grid } = geometry;
  const dragged = layout.groups.find((group) => group.id === draggedId);

  if (!dragged) {
    return null;
  }

  const ordered = layout.groups.filter((group) => group.id !== draggedId);
  const slot = clampIndex(index, ordered.length);
  ordered.splice(slot, 0, dragged);

  const heights = [...layout.before, ...ordered.map((group) => group.height), ...layout.after];
  const placement = packLinkGroups(heights, grid.columnCount, grid.rowGap)[layout.before.length + slot];

  if (!placement) {
    return null;
  }

  return {
    left: grid.originLeft + (placement.column - 1) * (grid.columnWidth + grid.columnGap),
    top: grid.originTop + placement.rowStart - 1,
    width: grid.columnWidth,
    height: dragged.height
  };
};

const distanceToCenter = (rect: GroupRect, center: Point) =>
  Math.hypot(rect.left + rect.width / 2 - center.x, rect.top + rect.height / 2 - center.y);

/**
 * Picks the slot (index among the other groups) whose resulting layout puts the
 * dragged card closest to where the pointer is carrying it.
 */
export const resolveGroupInsertion = (
  geometry: BookmarkDragGeometry,
  draggedId: string,
  cardCenter: Point,
  previousIndex: number
) => {
  const slotCount = geometry.layout.groups.filter((group) => group.id !== draggedId).length;
  let best = { index: previousIndex, distance: Number.POSITIVE_INFINITY };
  let current = Number.POSITIVE_INFINITY;

  for (let index = 0; index <= slotCount; index += 1) {
    const rect = simulateDraggedGroupRect(geometry, draggedId, index);

    if (!rect) {
      continue;
    }

    const distance = distanceToCenter(rect, cardCenter);

    if (index === previousIndex) {
      current = distance;
    }

    if (distance < best.distance) {
      best = { index, distance };
    }
  }

  return current - best.distance <= GROUP_SLOT_HYSTERESIS ? previousIndex : best.index;
};

const toBox = (element: HTMLElement, origin: DOMRect) => {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left - origin.left,
    top: rect.top - origin.top,
    right: rect.right - origin.left,
    bottom: rect.bottom - origin.top
  };
};

/** Reads the frozen geometry from the groups container. Call before drag styles apply. */
export const captureBookmarkDragGeometry = (container: HTMLElement): BookmarkDragGeometry => {
  const cards = [...container.querySelectorAll<HTMLElement>(":scope > .link-group")];
  const rowElements = (card: HTMLElement) => [
    ...card.querySelectorAll<HTMLElement>(".saved-link-list > .saved-link-row[data-link-id]")
  ];

  // A running FLIP transform would skew the measurements.
  for (const element of [...cards, ...cards.flatMap(rowElements)]) {
    cancelFlip(element);
  }

  const origin = container.getBoundingClientRect();
  const style = getComputedStyle(container);
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(style.paddingRight) || 0;
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const columnCount = readLinkGroupColumnCount(container);
  const columnGap = Number.parseFloat(style.columnGap) || 0;
  const contentWidth = container.clientWidth - paddingLeft - paddingRight;
  const layout: GroupLayout = { before: [], groups: [], after: [] };
  let seenGroup = false;
  let rowHeight = 0;

  const groups = cards.map<GroupBox>((card) => {
    const id = card.dataset.groupId ?? null;

    if (id) {
      seenGroup = true;
      layout.groups.push({ id, height: card.offsetHeight });
    } else {
      (seenGroup ? layout.after : layout.before).push(card.offsetHeight);
    }

    const rows = rowElements(card).map<RowBox>((row) => {
      const box = toBox(row, origin);
      rowHeight ||= row.offsetHeight;
      return { id: row.dataset.linkId ?? "", top: box.top, bottom: box.bottom };
    });

    return { id, ...toBox(card, origin), rows };
  });

  return {
    groups,
    layout,
    grid: {
      columnCount,
      rowGap: readLinkGroupMasonryGap(container),
      columnGap,
      columnWidth: Math.max(0, (contentWidth - columnGap * (columnCount - 1)) / columnCount),
      originLeft: container.clientLeft + paddingLeft,
      originTop: container.clientTop + paddingTop
    },
    rowHeight: rowHeight || DEFAULT_ROW_HEIGHT
  };
};

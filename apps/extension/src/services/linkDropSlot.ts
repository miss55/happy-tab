export type LinkDropPlacement = "before" | "after";

export type LinkDropSlot = {
  linkId: string | null;
  placement: LinkDropPlacement;
};

export type LinkDropRow = {
  id: string;
  top: number;
  bottom: number;
};

const rowMiddle = (row: LinkDropRow) => row.top + (row.bottom - row.top) / 2;

export const insertionIndexForSlot = (
  linkIds: readonly string[],
  slot: LinkDropSlot
): number => {
  if (!slot.linkId) {
    return linkIds.length;
  }

  const anchor = linkIds.indexOf(slot.linkId);

  if (anchor < 0) {
    return linkIds.length;
  }

  return anchor + (slot.placement === "after" ? 1 : 0);
};

const rawInsertionIndex = (rows: readonly LinkDropRow[], clientY: number) => {
  for (let index = 0; index < rows.length; index += 1) {
    if (clientY < rowMiddle(rows[index]!)) {
      return index;
    }
  }

  return rows.length;
};

const slotForIndex = (rows: readonly LinkDropRow[], index: number): LinkDropSlot => {
  if (index >= rows.length) {
    return { linkId: rows[rows.length - 1]?.id ?? null, placement: "after" };
  }

  return { linkId: rows[index]!.id, placement: "before" };
};

export const sameGroupInsertionIndex = (
  linkIds: readonly string[],
  draggedId: string,
  slot: LinkDropSlot
): number | null => {
  const insertionIndex = insertionIndexForSlot(linkIds, slot);
  const draggedIndex = linkIds.indexOf(draggedId);

  if (draggedIndex < 0) {
    return insertionIndex;
  }

  if (insertionIndex === draggedIndex || insertionIndex === draggedIndex + 1) {
    return null;
  }

  return draggedIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;
};

export type AnchoredDropSlot = {
  id: string;
  placement: LinkDropPlacement;
};

export const resolveAnchoredDropSlot = (
  orderedIds: readonly string[],
  targetId: string,
  clientY: number,
  bounds: { top: number; bottom: number },
  previous: AnchoredDropSlot | null = null
): AnchoredDropSlot => {
  const targetIndex = orderedIds.indexOf(targetId);
  const fallback = previous ?? { id: targetId, placement: "before" as const };

  if (targetIndex < 0) {
    return fallback;
  }

  const middle = bounds.top + (bounds.bottom - bounds.top) / 2;
  let insertion = clientY < middle ? targetIndex : targetIndex + 1;

  if (previous) {
    const previousInsertion = insertionIndexForSlot(orderedIds, {
      linkId: previous.id,
      placement: previous.placement
    });
    const band = Math.min(8, Math.max(0, bounds.bottom - bounds.top) * 0.12);

    if (previousInsertion !== insertion && Math.abs(clientY - middle) <= band) {
      insertion = previousInsertion;
    }
  }

  const slot: AnchoredDropSlot =
    insertion >= orderedIds.length
      ? { id: orderedIds[orderedIds.length - 1] ?? targetId, placement: "after" }
      : { id: orderedIds[insertion] ?? targetId, placement: "before" };

  if (
    previous &&
    insertionIndexForSlot(orderedIds, { linkId: previous.id, placement: previous.placement }) ===
      Math.min(insertion, orderedIds.length)
  ) {
    return previous;
  }

  return slot;
};

export const resolveLinkDropSlot = (
  rows: readonly LinkDropRow[],
  clientY: number,
  previous: LinkDropSlot | null = null
): LinkDropSlot => {
  if (rows.length === 0) {
    return { linkId: null, placement: "after" };
  }

  const rawIndex = rawInsertionIndex(rows, clientY);
  let index = rawIndex;

  if (previous) {
    const previousIndex = insertionIndexForSlot(
      rows.map((row) => row.id),
      previous
    );

    if (previousIndex !== rawIndex) {
      const boundary = rows[Math.min(previousIndex, rawIndex, rows.length - 1)];

      if (boundary) {
        const height = Math.max(0, boundary.bottom - boundary.top);
        const band = Math.min(height * 0.45, Math.max(10, height * 0.3));
        if (Math.abs(clientY - rowMiddle(boundary)) <= band) {
          index = Math.min(previousIndex, rows.length);
        }
      }
    }
  }

  const slot = slotForIndex(rows, index);

  if (previous && insertionIndexForSlot(rows.map((row) => row.id), previous) === index && previous.linkId) {
    return previous;
  }

  return slot;
};

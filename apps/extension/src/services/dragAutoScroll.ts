type DragPoint = Pick<DragEvent, "clientX" | "clientY">;

/** Scroll the workspace while a native drag is held near its visible edges. */
export const bindDragAutoScroll = (
  container: HTMLElement,
  isDragging: () => boolean,
  onScroll: (point: DragPoint) => void
) => {
  const document = container.ownerDocument;
  const view = document.defaultView!;
  const capture = { capture: true };
  let point: DragPoint | null = null;
  let frame: number | null = null;
  let lastTime: number | null = null;

  const stop = () => {
    if (frame !== null) view.cancelAnimationFrame(frame);
    frame = null;
    point = null;
    lastTime = null;
  };

  const tick = (time: number) => {
    frame = null;
    if (!point || !isDragging() || !container.isConnected) {
      stop();
      return;
    }

    const rect = container.getBoundingClientRect();
    const top = Math.max(0, rect.top);
    const bottom = Math.min(view.innerHeight, rect.bottom);
    const edge = Math.min(72, (bottom - top) / 3);
    if (edge <= 0 || point.clientX < rect.left || point.clientX > rect.right ||
      point.clientY < top || point.clientY > bottom) {
      stop();
      return;
    }

    const speed = point.clientY < top + edge
      ? -900 * (1 - (point.clientY - top) / edge)
      : point.clientY > bottom - edge
        ? 900 * (1 - (bottom - point.clientY) / edge)
        : 0;
    const elapsed = lastTime === null ? 16 : Math.min(32, time - lastTime);
    lastTime = time;
    const previous = container.scrollTop;
    container.scrollTop = Math.max(0, Math.min(
      Math.max(0, container.scrollHeight - container.clientHeight),
      previous + speed * elapsed / 1000
    ));

    if (container.scrollTop === previous) {
      stop();
      return;
    }

    // The pointer may be stationary while new rows move underneath it.
    onScroll(point);
    frame = view.requestAnimationFrame(tick);
  };

  const move = (event: DragEvent) => {
    if (!isDragging()) {
      stop();
      return;
    }
    point = { clientX: event.clientX, clientY: event.clientY };
    if (frame === null) frame = view.requestAnimationFrame(tick);
  };
  const leave = (event: DragEvent) => {
    if (!event.relatedTarget) stop();
  };
  const visibility = () => {
    if (document.hidden) stop();
  };

  document.addEventListener("dragover", move, capture);
  document.addEventListener("dragleave", leave, capture);
  document.addEventListener("drop", stop, capture);
  document.addEventListener("dragend", stop, capture);
  document.addEventListener("visibilitychange", visibility);
  view.addEventListener("blur", stop);

  return () => {
    stop();
    document.removeEventListener("dragover", move, capture);
    document.removeEventListener("dragleave", leave, capture);
    document.removeEventListener("drop", stop, capture);
    document.removeEventListener("dragend", stop, capture);
    document.removeEventListener("visibilitychange", visibility);
    view.removeEventListener("blur", stop);
  };
};

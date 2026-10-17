/** Route vertical mouse-wheel input to an overflowing horizontal strip. */
export const scrollHorizontalOnWheel = (
  event: WheelEvent,
  track: HTMLElement | null = event.currentTarget as HTMLElement | null,
): void => {
  if (!track || event.defaultPrevented || event.ctrlKey) return;
  const maximum = track.scrollWidth - track.clientWidth;
  if (maximum <= 0) return;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1;
  const delta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  // Consume overflowing navigation gestures even at the ends to keep the page still.
  event.preventDefault();
  track.scrollLeft = Math.max(0, Math.min(maximum, track.scrollLeft + delta * unit));
};

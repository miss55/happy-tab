import { describe, expect, it, vi } from "vitest";
import { scrollHorizontalOnWheel } from "./horizontalWheel";

const wheel = (left: number, overrides: Record<string, unknown> = {}) => {
  const track = { scrollWidth: 1000, clientWidth: 300, scrollLeft: left };
  const event = { currentTarget: track, deltaX: 0, deltaY: 100, deltaMode: 0,
    ctrlKey: false, defaultPrevented: false, preventDefault: vi.fn(), ...overrides };
  scrollHorizontalOnWheel(event as unknown as WheelEvent);
  return { track, event };
};

describe("horizontal strip wheel scrolling", () => {
  it("scrolls overflowing cards in both directions and consumes the wheel", () => {
    const forward = wheel(0);
    expect(forward.track.scrollLeft).toBe(100);
    expect(forward.event.preventDefault).toHaveBeenCalledOnce();
    expect(wheel(200, { deltaY: -100 }).track.scrollLeft).toBe(100);
  });

  it("consumes scrolling at both ends of an overflowing strip", () => {
    for (const result of [wheel(0, { deltaY: -100 }), wheel(700), wheel(700, { deltaX: 120 })]) {
      expect(result.event.preventDefault).toHaveBeenCalledOnce();
    }
    expect(wheel(0, { deltaY: -100 }).track.scrollLeft).toBe(0);
    expect(wheel(700).track.scrollLeft).toBe(700);
  });

  it("leaves page scrolling available without overflow", () => {
    expect(wheel(0, { currentTarget: { scrollWidth: 200, clientWidth: 300, scrollLeft: 0 } }).event.preventDefault).not.toHaveBeenCalled();
  });

  it("preserves pinch zoom and previously handled gestures", () => {
    for (const result of [wheel(100, { ctrlKey: true }),
      wheel(100, { defaultPrevented: true })]) {
      expect(result.event.preventDefault).not.toHaveBeenCalled();
      expect(result.track.scrollLeft).toBe(100);
    }
  });

  it("routes horizontal and diagonal touchpad gestures only horizontally", () => {
    const result = wheel(100, { deltaX: 120, deltaY: 20 });
    expect(result.track.scrollLeft).toBe(220);
    expect(result.event.preventDefault).toHaveBeenCalledOnce();
  });

  it("uses the supplied track when the wheel originates in the navigation header", () => {
    const track = { scrollWidth: 1000, clientWidth: 300, scrollLeft: 0 };
    const event = { currentTarget: {}, deltaX: 0, deltaY: 100, deltaMode: 0, preventDefault: vi.fn() };
    scrollHorizontalOnWheel(event as unknown as WheelEvent, track as HTMLElement);
    expect(track.scrollLeft).toBe(100);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it("handles line and page deltas and clamps at the end", () => {
    expect(wheel(0, { deltaY: 3, deltaMode: 1 }).track.scrollLeft).toBe(48);
    expect(wheel(0, { deltaY: 1, deltaMode: 2 }).track.scrollLeft).toBe(300);
    expect(wheel(650).track.scrollLeft).toBe(700);
  });
});

import { describe, expect, it, vi } from "vitest";
import { bindDragAutoScroll } from "./dragAutoScroll";

const setup = () => {
  const frames = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  let time = 0;
  const view = Object.assign(new EventTarget(), {
    innerHeight: 800,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++nextId, callback);
      return nextId;
    },
    cancelAnimationFrame: (id: number) => { frames.delete(id); }
  });
  const document = Object.assign(new EventTarget(), { defaultView: view, hidden: false });
  const container = {
    ownerDocument: document,
    isConnected: true,
    scrollTop: 500,
    scrollHeight: 2000,
    clientHeight: 700,
    getBoundingClientRect: () => ({ left: 330, right: 1200, top: 100, bottom: 800 })
  };
  const onScroll = vi.fn();
  let dragging = true;
  const disconnect = bindDragAutoScroll(container as unknown as HTMLElement, () => dragging, onScroll);
  const event = (type: string, props = {}) => {
    document.dispatchEvent(Object.assign(new Event(type), props));
  };
  const move = (clientX: number, clientY: number) => event("dragover", { clientX, clientY });
  const step = () => {
    time += 16;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(time));
  };
  return { container, document, view, onScroll, frames, move, step, event, disconnect,
    endDrag: () => { dragging = false; } };
};

describe("workspace drag auto scrolling", () => {
  it("keeps scrolling toward the hidden navigation while the pointer is stationary", () => {
    const test = setup();
    test.move(600, 102);
    test.step();
    const first = test.container.scrollTop;
    expect(first).toBeLessThan(500);
    test.step();
    expect(test.container.scrollTop).toBeLessThan(first);
    expect(test.onScroll).toHaveBeenCalledTimes(2);
    expect(test.onScroll).toHaveBeenLastCalledWith({ clientX: 600, clientY: 102 });
    test.disconnect();
  });

  it("scrolls down and updates previews as new groups pass under the pointer", () => {
    const test = setup();
    test.move(600, 798);
    test.step();
    expect(test.container.scrollTop).toBeGreaterThan(500);
    expect(test.onScroll).toHaveBeenCalledOnce();
    test.disconnect();
  });

  it("leaves the center, sidebar, and points outside the viewport alone", () => {
    for (const [x, y] of [[600, 400], [100, 102], [600, 90], [600, 810], [1250, 798]]) {
      const test = setup();
      test.move(x!, y!);
      test.step();
      expect(test.container.scrollTop).toBe(500);
      expect(test.frames.size).toBe(0);
      test.disconnect();
    }
  });

  it("stops on leaving the edge and restarts when the pointer returns", () => {
    const test = setup();
    test.move(600, 102);
    test.step();
    const scrolled = test.container.scrollTop;
    test.move(600, 400);
    test.step();
    expect(test.container.scrollTop).toBe(scrolled);
    expect(test.frames.size).toBe(0);
    test.move(600, 102);
    test.step();
    expect(test.container.scrollTop).toBeLessThan(scrolled);
    test.disconnect();
  });

  it("clamps at both scroll limits and stops scheduling frames", () => {
    for (const [start, y, limit] of [[1, 100, 0], [1299, 800, 1300]]) {
      const test = setup();
      test.container.scrollTop = start!;
      test.move(600, y!);
      test.step();
      test.step();
      expect(test.container.scrollTop).toBe(limit);
      expect(test.frames.size).toBe(0);
      test.disconnect();
    }
  });

  it("uses the visible viewport edge when the container extends below it", () => {
    const test = setup();
    test.container.getBoundingClientRect = () => ({ left: 330, right: 1200, top: -100, bottom: 1200 });
    test.move(600, 798);
    test.step();
    expect(test.container.scrollTop).toBeGreaterThan(500);
    test.disconnect();
  });

  it.each(["drop", "dragend", "dragleave"])("cancels queued scrolling on %s", (type) => {
    const test = setup();
    test.move(600, 102);
    test.event(type, { relatedTarget: null });
    test.step();
    expect(test.container.scrollTop).toBe(500);
    expect(test.frames.size).toBe(0);
    test.disconnect();
  });

  it("preserves scrolling when moving between child drop targets", () => {
    const test = setup();
    test.move(600, 102);
    test.event("dragleave", { relatedTarget: {} });
    test.step();
    expect(test.container.scrollTop).toBeLessThan(500);
    test.disconnect();
  });

  it("stops when drag state clears or the container is removed", () => {
    for (const clear of ["drag", "container"]) {
      const test = setup();
      test.move(600, 102);
      if (clear === "drag") test.endDrag();
      else test.container.isConnected = false;
      test.step();
      expect(test.container.scrollTop).toBe(500);
      expect(test.frames.size).toBe(0);
      test.disconnect();
    }
  });

  it("cleans up frames and listeners when unbound", () => {
    const test = setup();
    test.move(600, 102);
    test.disconnect();
    test.move(600, 102);
    test.step();
    expect(test.container.scrollTop).toBe(500);
    expect(test.frames.size).toBe(0);
  });
});

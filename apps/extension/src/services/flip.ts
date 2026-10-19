const FLIP_ANIMATION_ID = "tabvia-flip";
const FLIP_DURATION_MS = 260;
const FLIP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export type FlipSnapshot = Map<HTMLElement, DOMRect>;

export const canAnimateFlip = () =>
  typeof Element !== "undefined" &&
  typeof Element.prototype.animate === "function" &&
  !(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);

export const flipOffset = (from: Pick<DOMRect, "left" | "top">, to: Pick<DOMRect, "left" | "top">) => {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  return Math.abs(dx) < 1 && Math.abs(dy) < 1 ? null : { dx, dy };
};

export const cancelFlip = (element: HTMLElement) => {
  for (const animation of element.getAnimations()) {
    if (animation.id === FLIP_ANIMATION_ID) {
      animation.cancel();
    }
  }
};

/** Reads positions including any running FLIP transform, so interrupted moves continue smoothly. */
export const captureFlip = (elements: Iterable<HTMLElement>): FlipSnapshot => {
  const snapshot: FlipSnapshot = new Map();

  if (!canAnimateFlip()) {
    return snapshot;
  }

  for (const element of elements) {
    snapshot.set(element, element.getBoundingClientRect());
  }

  return snapshot;
};

export const playFlip = (snapshot: FlipSnapshot, elements: Iterable<HTMLElement> = snapshot.keys()) => {
  if (snapshot.size === 0) {
    return;
  }

  const targets = [...elements].flatMap((element) => {
    const from = snapshot.get(element);

    if (!from || !element.isConnected) {
      return [];
    }

    cancelFlip(element);
    return [{ element, from }];
  });

  for (const { element, from } of targets) {
    const offset = flipOffset(from, element.getBoundingClientRect());

    if (!offset) {
      continue;
    }

    const animation = element.animate(
      [{ transform: `translate(${offset.dx}px, ${offset.dy}px)` }, { transform: "translate(0, 0)" }],
      { duration: FLIP_DURATION_MS, easing: FLIP_EASING }
    );
    animation.id = FLIP_ANIMATION_ID;
  }
};

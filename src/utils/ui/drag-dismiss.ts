"use client";

import { useEffect, useRef, type PointerEvent, type RefObject } from "react";

const SLACK = 8;
const DISTANCE = 0.3;
const VELOCITY = 0.5;
const OUT_MS = 180;
const BACK_MS = 220;
const EASE = "cubic-bezier(0.2, 0, 0.2, 1)";

const KEEPS_THE_TOUCH =
  "input, textarea, select, [contenteditable=''], [contenteditable='true'], [data-no-drag]";

type Drag = {
  id: number;
  x: number;
  y: number;
  size: number;
  off: number;
  was: number;
  wasAt: number;
  live: boolean;
  anim: Animation | null;
  veil: Animation | null;
};

export function useDragDismiss(
  ref: RefObject<HTMLElement | null>,
  {
    open,
    axis,
    towards,
    onDismiss,
    enabled = true,
  }: {
    open: boolean;
    axis: "x" | "y";
    towards: -1 | 1;
    onDismiss: () => void;
    enabled?: boolean;
  },
) {
  const drag = useRef<Drag | null>(null);
  const playing = useRef<Animation[]>([]);
  const dragged = useRef(false);

  const play = (
    panel: HTMLElement,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => {
    try {
      const animation = panel.animate(frames, options);
      playing.current.push(animation);
      return animation;
    } catch {
      return null;
    }
  };

  const place = (off: number) =>
    axis === "x"
      ? `translateX(${off * towards}px)`
      : `translateY(${off * towards}px)`;

  useEffect(() => {
    if (!open) return;
    drag.current = null;
    playing.current.forEach((animation) => animation.cancel());
    playing.current = [];
  }, [open]);

  useEffect(() => {
    const panel = ref.current;
    if (!open || !panel || !enabled) return;

    const keep = (event: TouchEvent) => {
      if (drag.current?.live && event.cancelable) event.preventDefault();
    };

    panel.addEventListener("touchmove", keep, { passive: false });
    return () => panel.removeEventListener("touchmove", keep);
  }, [ref, open, enabled]);

  function down(event: PointerEvent<HTMLElement>) {
    const panel = ref.current;
    if (!enabled || !panel) return;
    if (event.target === panel) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest(KEEPS_THE_TOUCH)) return;
    for (let node = target; node; node = node.parentElement) {
      if (axis === "y" ? node.scrollTop > 0 : node.scrollLeft > 0) return;
      if (node === panel) break;
    }

    dragged.current = false;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      size: axis === "x" ? panel.offsetWidth : panel.offsetHeight,
      off: 0,
      was: 0,
      wasAt: event.timeStamp,
      live: false,
      anim: null,
      veil: null,
    };
  }

  function move(event: PointerEvent<HTMLElement>) {
    const state = drag.current;
    const panel = ref.current;
    if (!state || !panel || state.id !== event.pointerId) return;

    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    const along = (axis === "x" ? dx : dy) * towards;
    const across = axis === "x" ? dy : dx;

    if (!state.live) {
      if (Math.abs(along) < SLACK && Math.abs(across) < SLACK) return;
      if (along < SLACK || Math.abs(across) > Math.abs(along)) {
        drag.current = null;
        return;
      }
      state.live = true;
      dragged.current = true;
      panel.setPointerCapture(event.pointerId);
    }

    const off = along > 0 ? along : along / 4;
    state.was = state.off;
    state.wasAt = event.timeStamp;
    state.off = Math.max(0, off);

    const held = { duration: 1, fill: "both" } as const;

    const frame = [{ transform: place(state.off) }];
    const effect = state.anim?.effect;
    if (effect instanceof KeyframeEffect) effect.setKeyframes(frame);
    else state.anim = play(panel, frame, held);

    const dim = [{ opacity: `${Math.max(0, 1 - state.off / state.size)}` }];
    const veil = state.veil?.effect;
    if (veil instanceof KeyframeEffect) veil.setKeyframes(dim);
    else state.veil = play(panel, dim, { ...held, pseudoElement: "::backdrop" });
  }

  function up(event: PointerEvent<HTMLElement>) {
    const state = drag.current;
    const panel = ref.current;
    drag.current = null;
    if (!state?.live || !panel) return;

    const since = Math.max(1, event.timeStamp - state.wasAt);
    const speed = (state.off - state.was) / since;
    const out = state.off > state.size * DISTANCE || speed > VELOCITY;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      state.anim?.cancel();
      state.veil?.cancel();
      if (out) onDismiss();
      return;
    }

    const ms = out ? OUT_MS : BACK_MS;
    const dark = `${Math.max(0, 1 - state.off / state.size)}`;
    const settle = play(
      panel,
      [{ transform: place(state.off) }, { transform: place(out ? state.size : 0) }],
      { duration: ms, easing: EASE, fill: "forwards" },
    );
    play(panel, [{ opacity: dark }, { opacity: out ? "0" : "1" }], {
      duration: ms,
      easing: EASE,
      fill: "forwards",
      pseudoElement: "::backdrop",
    });
    state.anim?.cancel();
    state.veil?.cancel();

    if (out) {
      onDismiss();
      return;
    }
    settle?.finished
      .then(() => {
        playing.current.forEach((animation) => animation.cancel());
        playing.current = [];
      })
      .catch(() => {});
  }

  return {
    onPointerDown: down,
    onPointerMove: move,
    onPointerUp: up,
    onPointerCancel: () => {
      const state = drag.current;
      const panel = ref.current;
      drag.current = null;
      if (!state?.live || !panel) return;

      const back = play(panel, [{ transform: place(state.off) }, { transform: "none" }], {
        duration: BACK_MS,
        easing: EASE,
        fill: "forwards",
      });
      play(panel, [{ opacity: "1" }], {
        duration: BACK_MS,
        easing: EASE,
        fill: "forwards",
        pseudoElement: "::backdrop",
      });
      state.anim?.cancel();
      state.veil?.cancel();
      back?.finished
        .then(() => {
          playing.current.forEach((animation) => animation.cancel());
          playing.current = [];
        })
        .catch(() => {});
    },
    onClickCapture: (event: { preventDefault: () => void; stopPropagation: () => void }) => {
      if (!dragged.current) return;
      dragged.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/utils/cn";
import type { StepDirection } from "@/utils/motion/step-arrival";

export function stepAnimationClass(direction: StepDirection = null) {
  return direction === "forward"
    ? "animate-step-forward"
    : direction === "back"
      ? "animate-step-back"
      : "animate-rise";
}

export function StepTransition({
  direction = null,
  order = 0,
  className,
  children,
}: {
  direction?: StepDirection;
  order?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-direction={direction ?? "enter"}
      style={
        order && direction === null
          ? ({ animationDelay: `${order * 70}ms` } as CSSProperties)
          : undefined
      }
      className={cn(stepAnimationClass(direction), className)}
    >
      {children}
    </div>
  );
}

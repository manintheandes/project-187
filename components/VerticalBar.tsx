"use client";
import React from "react";

type Props = {
  value: number;
  max: number;
  normalColor: string; // tailwind class e.g. bg-[#CAA70A]
  redAtOrAbove?: number;
  redWhenOver?: number;
  className?: string; // controls outer width/height
};

export default function VerticalBar({ value, max, normalColor, redAtOrAbove, redWhenOver, className }: Props) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const hitRed =
    (redAtOrAbove !== undefined && value >= redAtOrAbove) ||
    (redWhenOver !== undefined && value > redWhenOver);

  const containerCls = `relative bg-[var(--muted-gray)] border border-black/30 overflow-hidden ${className ?? "w-[200px] h-[320px]"}`;

  return (
    <div className={containerCls} aria-hidden>
      {/* base fill bottom-up */}
      <div
        className={`absolute left-0 bottom-0 w-full ${hitRed ? "bg-red-500" : normalColor}`}
        style={{ height: `${pct * 100}%`, transition: "height 200ms ease-out" }}
      />
    </div>
  );
}



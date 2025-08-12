"use client";
import React from "react";

export type BarProps = {
  value: number;
  max: number;
  normalColor: string; // Tailwind class, e.g., bg-[#CAA70A]
  redAtOrAbove?: number;
  redWhenOver?: number;
  className?: string; // additional classes for the outer track
};

export default function ProgressBar({ value, max, normalColor, redAtOrAbove, redWhenOver, className }: BarProps) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const hitRed =
    (redAtOrAbove !== undefined && value >= redAtOrAbove) ||
    (redWhenOver !== undefined && value > redWhenOver);

  return (
    <div className={`relative w-full h-8 sm:h-9 md:h-12 bg-[var(--muted-gray)] rounded overflow-hidden mx-auto ${className ?? ""}`}>
      <div
        className={`absolute left-0 top-0 h-full ${hitRed ? "bg-red-500" : normalColor}`}
        style={{ width: `${pct * 100}%`, transition: "width 200ms ease-out" }}
      />
    </div>
  );
}



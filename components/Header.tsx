"use client";
import React from "react";

export default function Header() {
  return (
    <header className="pt-6 md:pt-10">
      <h1
        className="font-black text-[56px] leading-[0.95] tracking-tight-h1 sm:text-[64px] md:text-[88px] lg:text-[96px]"
        aria-label="Project 187"
      >
        Project 187
      </h1>
      <p className="mt-1 text-[11px] uppercase tracking-[0.06em] text-black/60 md:text-[12px]">HE</p>
      {/* informational tagline removed by request */}
      <div className="mt-4 md:mt-6 lg:mt-8 flex items-center gap-4">
        <div className="rule flex-1 max-w-[560px]" />
        <div className="rule flex-1" />
      </div>
    </header>
  );
}



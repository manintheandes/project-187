"use client";
import React from "react";

export default function Header() {
  return (
    <header className="pt-8 md:pt-10">
      <h1
        className="font-black text-[42px] leading-[0.95] tracking-tight-h1 md:text-[88px] lg:text-[96px]"
        aria-label="Project 187"
      >
        Project 187
      </h1>
      <p className="mt-1 text-[12px] uppercase tracking-[0.06em] text-black/60">HE</p>
      <p className="mt-1 text-[12px] text-black/50">Changes sync across devices when deployed with Vercel KV.</p>
      <div className="mt-6 md:mt-6 lg:mt-8 flex items-center gap-4">
        <div className="rule flex-1 max-w-[560px]" />
        <div className="rule flex-1" />
      </div>
    </header>
  );
}



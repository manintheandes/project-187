"use client";
import React, { useEffect, useState } from "react";
import ProgressBar from "@/components/ProgressBar";
import { ensureTodayInitialized, getTodayIso, readWeightFor, writeWeightFor } from "@/lib/storage";

export default function WeightPanel() {
  const [todayKey, setTodayKey] = useState<string>("");
  const [weight, setWeight] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const TARGET = 195; // caps at right edge
  const THRESHOLD = 188; // color change point

  useEffect(() => {
    ensureTodayInitialized();
    const key = getTodayIso();
    setTodayKey(key);
    setWeight(readWeightFor(key));

    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      const k = getTodayIso();
      if (e.key.includes(`project187 weight ${k}`) || e.key.includes(`project187 calories ${k}`)) {
        setWeight(readWeightFor(k));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Poll remote state to reflect updates from other devices
  useEffect(() => {
    let cancelled = false;
    async function pull() {
      const d = getTodayIso();
      try {
        const res = await fetch(`/api/state?date=${encodeURIComponent(d)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { weight?: number | null };
        if (cancelled) return;
        if (data.weight === null || typeof data.weight === "number") {
          setWeight((prev) => {
            if (prev !== data.weight) {
              writeWeightFor(d, data.weight ?? null);
              return data.weight ?? null;
            }
            return prev;
          });
        }
      } catch {}
    }
    pull();
    const id = setInterval(pull, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const current = weight ?? 0;

  function onSet() {
    const val = Number(input.trim());
    if (!Number.isFinite(val)) return;
    writeWeightFor(todayKey, val);
    setWeight(val);
    setInput("");
    window.__toastPush?.(`Set weight to ${val}`);
    // remote sync fire-and-forget
    fetch(`/api/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayKey, weight: val }),
    }).catch(() => {});
  }

  return (
    <section aria-labelledby="weight-heading">
      {/* Weight bar (horizontal) */}
      <ProgressBar value={current} max={TARGET} normalColor="bg-[#E5D7A0]" redAtOrAbove={THRESHOLD} />
      <h2 id="weight-heading" className="sr-only">Current Weight</h2>
      <div className="mt-4 md:mt-6 min-h-[120px] md:min-h-[156px]">
        <div className="text-[56px] md:text-[72px] leading-none font-black">
          {weight == null ? "--" : weight}
        </div>
        <div className="mt-2">
          <div className="text-[14px] font-medium">Current Weight</div>
          <div className="text-[12px] text-black/60 h-[16px]">{weight == null ? "No weight set" : "\u00A0"}</div>
        </div>
      </div>
      <div className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <label className="sr-only" htmlFor="set-weight">Set weight</label>
        <input
          id="set-weight"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Set weight"
          className="h-12 box-border w-full sm:w-[360px] px-4 border border-gray-300 rounded-md text-[16px] leading-none appearance-none"
          inputMode="decimal"
        />
        <button
          type="button"
          className="inline-flex items-center justify-center h-12 box-border px-5 rounded-md bg-black text-white text-[16px] leading-none select-none border border-transparent w-full sm:w-auto"
          onClick={onSet}
          disabled={!input.trim() || !Number.isFinite(Number(input))}
        >
          Set
        </button>
      </div>
    </section>
  );
}



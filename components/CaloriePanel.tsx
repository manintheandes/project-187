"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getTodayIso } from "@/lib/storage";
import { ensureTodayInitialized } from "@/lib/storage";
import ProgressBar from "@/components/ProgressBar";

// one serving defaults for your six foods
type Macros = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  satFat: number;
  fiber: number;
};

export const FOODS: Record<string, Macros> = {
  // from the label you sent: 1 bagel 85 g
  bagel: { kcal: 140, protein: 15, carbs: 36, fat: 5, satFat: 0.5, fiber: 30 },

  // Hodo yuba sheets per 3 oz serving
  // Yuba full package (about 1.5 servings per container from label)
  // Per serving: 150 kcal, 21g protein, 11g carbs (3g fiber), 3g fat, 1g sat fat
  // Full package totals = 1.5x
  yuba: { kcal: 225, protein: 31.5, carbs: 16.5, fat: 4.5, satFat: 1.5, fiber: 4.5 },

  // oatmeal label: 1/3 cup dry
  oatmeal: { kcal: 190, protein: 10, carbs: 32, fat: 4, satFat: 1, fiber: 6 },

  // broccoli 1 cup
  broccoli: { kcal: 35, protein: 2, carbs: 6, fat: 0, satFat: 0, fiber: 2 },

  // plant based protein bar
  bar: { kcal: 160, protein: 12, carbs: 12, fat: 10, satFat: 2.5, fiber: 9 },

  // Mission Carb Balance whole wheat tortilla
  tortilla: { kcal: 70, protein: 5, carbs: 18, fat: 3.5, satFat: 1, fiber: 15 },
  wrap: { kcal: 70, protein: 5, carbs: 18, fat: 3.5, satFat: 1, fiber: 15 }, // alias
};

type Totals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  satFat: number;
  fiber: number;
};

const EMPTY: Totals = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  satFat: 0,
  fiber: 0,
};

function todayKey(prefix: string) {
  const d = getTodayIso();
  return `${prefix}-${d}`;
}

// tiny modal in the same file for one paste simplicity
function DailySummaryModal({
  open,
  onClose,
  totals,
}: {
  open: boolean;
  onClose: () => void;
  totals: Totals;
}) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[480px] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">Daily Summary</h2>
          <button onClick={onClose} className="rounded-md bg-gray-200 px-3 py-1">
            Close
          </button>
        </div>
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <span>Calories</span>
            <span>{totals.kcal}</span>
          </div>
          <div className="flex justify-between">
            <span>Protein g</span>
            <span>{totals.protein}</span>
          </div>
          <div className="flex justify-between">
            <span>Carbs g</span>
            <span>{totals.carbs}</span>
          </div>
          <div className="flex justify-between">
            <span>Fat g</span>
            <span>{totals.fat}</span>
          </div>
          <div className="flex justify-between">
            <span>Sat fat g</span>
            <span>{totals.satFat}</span>
          </div>
          <div className="flex justify-between">
            <span>Fiber g</span>
            <span>{totals.fiber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CaloriePanel() {
  const [calorieInput, setCalorieInput] = useState("");
  const [note, setNote] = useState("");
  const [calories, setCalories] = useState(0);
  const [totals, setTotals] = useState<Totals>(EMPTY);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const hasMountedRef = useRef(false);
  const skipNextPostRef = useRef(false);

  useEffect(() => {
    ensureTodayInitialized();
    const c = Number(localStorage.getItem(todayKey("calories")) ?? "0");
    setCalories(c);
    const t = localStorage.getItem(todayKey("totals"));
    setTotals(t ? (JSON.parse(t) as Totals) : EMPTY);

    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      const d = getTodayIso();
      if (e.key === `calories-${d}` || e.key === `totals-${d}` || e.key.startsWith("project187 ")) {
        const cc = Number(localStorage.getItem(todayKey("calories")) ?? "0");
        const tt = localStorage.getItem(todayKey("totals"));
        setCalories(cc);
        setTotals(tt ? (JSON.parse(tt) as Totals) : EMPTY);
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
        const data = (await res.json()) as { calories?: number };
        if (cancelled) return;
        if (typeof data.calories === "number") {
          const c = data.calories;
          setCalories((prev) => {
            if (prev !== c) {
              localStorage.setItem(todayKey("calories"), String(c));
              // mark that this change came from remote so we do not echo it back
              skipNextPostRef.current = true;
              return c;
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

  useEffect(() => {
    localStorage.setItem(todayKey("calories"), String(calories));
    localStorage.setItem(todayKey("totals"), JSON.stringify(totals));
    // Fire-and-forget remote sync if configured
    const d = getTodayIso();
    // On first mount or when we just pulled from remote, skip posting to avoid overwriting
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (skipNextPostRef.current) {
      skipNextPostRef.current = false;
      return;
    }
    fetch(`/api/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: d, calories }),
    }).catch(() => {});
  }, [calories, totals]);

  function addMacros(m: Macros) {
    setCalories((prev) => prev + m.kcal);
    setTotals((prev) => ({
      kcal: prev.kcal + m.kcal,
      protein: prev.protein + m.protein,
      carbs: prev.carbs + m.carbs,
      fat: prev.fat + m.fat,
      satFat: prev.satFat + m.satFat,
      fiber: prev.fiber + m.fiber,
    }));
  }

  function handleAddCalories() {
    const raw = calorieInput.trim().toLowerCase();
    if (!raw) return;

    if (FOODS[raw]) {
      addMacros(FOODS[raw]);
      setNote(`Added one ${raw}`);
      setCalorieInput("");
      return;
    }

    const math = raw.replace(/x/gi, "*");
    const val = Number(eval(math));
    if (!isFinite(val) || val <= 0) {
      setNote("Could not understand that entry");
      return;
    }
    const inc = Math.round(val);
    setCalories((prev) => prev + inc);
    setTotals((prev) => ({ ...prev, kcal: prev.kcal + inc }));
    setNote(`Added ${inc} calories`);
    setCalorieInput("");
  }

  function handleClearToday() {
    setCalories(0);
    setTotals(EMPTY);
    localStorage.setItem(todayKey("calories"), "0");
    localStorage.setItem(todayKey("totals"), JSON.stringify(EMPTY));
    setNote("Cleared today");
  }

  const remaining = useMemo(() => Math.max(0, 1500 - calories), [calories]);

  const pct = Math.min(1, calories / 1500);
  const over = calories > 1500;

  return (
    <div>
      {/* progress bar (horizontal) */}
      <ProgressBar value={calories} max={1500} normalColor="bg-[#CAA70A]" redWhenOver={1500} />

      {/* big number and captions */}
      <div className="mt-6 min-h-[140px] md:min-h-[156px]">
        <div className="text-7xl font-extrabold">{calories}</div>
        <div className="mt-2 text-sm font-medium">Daily Calories</div>
        <div className="text-sm text-gray-500 h-[16px]">{remaining} to go</div>
      </div>

      {/* input row */}
      <div className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <input
          type="text"
          placeholder="Type bagel or yuba or oatmeal or broccoli or bar or tortilla"
          className="h-12 box-border w-full sm:w-[360px] px-4 border border-gray-300 rounded-md text-[16px] leading-none appearance-none"
          value={calorieInput}
          onChange={(e) => setCalorieInput(e.target.value)}
        />
        <button
          onClick={handleAddCalories}
          className="inline-flex items-center justify-center h-12 box-border px-5 rounded-md bg-black text-white text-[16px] leading-none border border-transparent w-full sm:w-auto"
        >
          Add
        </button>
      </div>

      {note && <p className="mt-2 text-sm text-gray-600">{note}</p>}

      {/* links */}
      <div className="mt-3 text-sm h-[24px]">
        <button onClick={() => setSummaryOpen(true)} className="underline">
          Daily Summary
        </button>
        <span className="mx-2">•</span>
        <button onClick={handleClearToday} className="underline">
          Clear Today
        </button>
      </div>

      <DailySummaryModal open={summaryOpen} onClose={() => setSummaryOpen(false)} totals={totals} />
    </div>
  );
}


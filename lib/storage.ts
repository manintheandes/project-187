export type YMD = `${number}-${number}-${number}`;

export const DAILY_LIMIT = 1500;

export function getTodayKeyParts(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const key = `${year}-${month}-${day}` as YMD;
  return { year, month, day, key };
}

export function getTodayIso(date = new Date()) {
  const { key } = getTodayKeyParts(date);
  return key;
}

const SCOPE_DATE_KEY = "project187 date";

function dayScopedKey(prefix: "calories" | "weight", dateKey: string) {
  return `project187 ${prefix} ${dateKey}`;
}

export function getStoredScopeDate(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SCOPE_DATE_KEY);
}

export function setStoredScopeDate(ymd: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SCOPE_DATE_KEY, ymd);
}

export function readCaloriesFor(dateKey: string): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(dayScopedKey("calories", dateKey));
  const n = v ? Number(v) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function writeCaloriesFor(dateKey: string, total: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(dayScopedKey("calories", dateKey), String(Math.max(0, Math.floor(total))))
}

export function readWeightFor(dateKey: string): number | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(dayScopedKey("weight", dateKey));
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function writeWeightFor(dateKey: string, weight: number | null) {
  if (typeof window === "undefined") return;
  const key = dayScopedKey("weight", dateKey);
  if (weight == null) localStorage.removeItem(key);
  else localStorage.setItem(key, String(weight));
}

export type HistoryRow = { date: YMD; calories: number; weight: number | null };

export function readAllHistory(): HistoryRow[] {
  if (typeof window === "undefined") return [];
  const rows: HistoryRow[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (!k.startsWith("project187 ")) continue;
    if (k.includes("calories ")) {
      const date = k.split("calories ")[1] as YMD;
      const calories = Number(localStorage.getItem(k) || 0) || 0;
      const weightKey = dayScopedKey("weight", date);
      const weightStr = localStorage.getItem(weightKey);
      const weight = weightStr == null ? null : Number(weightStr);
      rows.push({ date, calories, weight: Number.isFinite(weight!) ? weight! : null });
    }
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  return rows;
}

export function upsertHistoryRow(row: HistoryRow) {
  writeCaloriesFor(row.date, row.calories);
  writeWeightFor(row.date, row.weight);
}

// Simple math parser supporting "a x b" and "a plus b" and decimals
export function parseCaloriesInput(input: string): number | null {
  const cleaned = input.replace(/\s+/g, " ").trim().toLowerCase();
  if (!cleaned) return null;

  const symbolMap: Record<string, string> = {
    "×": "x",
    "*": "x",
    "plus": "+",
    ",": ".",
  };
  const normalized = cleaned
    .split("")
    .map((c) => symbolMap[c] ?? c)
    .join("")
    .replace(/\s*x\s*/g, "x")
    .replace(/\s*\+\s*/g, "+");

  // handle expressions like 150x1.5 or 90+60 or 150x1.5+30
  const tokens = normalized.split("+");
  let sum = 0;
  for (const token of tokens) {
    if (!token) continue;
    if (token.includes("x")) {
      const [a, b] = token.split("x");
      const n1 = Number(a);
      const n2 = Number(b);
      if (!Number.isFinite(n1) || !Number.isFinite(n2)) return null;
      if (n1 < 0 || n2 < 0) return null;
      sum += n1 * n2;
    } else {
      const n = Number(token);
      if (!Number.isFinite(n) || n < 0) return null;
      sum += n;
    }
  }
  if (!Number.isFinite(sum) || sum < 0) return null;
  return Math.round(sum * 100) / 100;
}

export const DEMO_SEED = true; // toggle to false to disable demo prefill

export function ensureTodayInitialized() {
  if (typeof window === "undefined") return;
  const today = getTodayIso();
  const scope = getStoredScopeDate();
  if (scope !== today) {
    // new day
    setStoredScopeDate(today);
    writeCaloriesFor(today, 0);
    writeWeightFor(today, null);
    if (DEMO_SEED) {
      writeWeightFor(today, 189.8);
    }
  }
}



"use client";
import React, { useEffect, useState } from "react";
import {
  YMD,
  HistoryRow,
  readAllHistory,
  upsertHistoryRow,
  getTodayIso,
  readCaloriesFor,
  writeCaloriesFor,
  readWeightFor,
  writeWeightFor,
} from "@/lib/storage";

function formatDatePretty(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function HistoryModal() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<HistoryRow[]>([]);

  const today = getTodayIso();

  const refresh = () => setRows(readAllHistory());

  useEffect(() => {
    refresh();
    const onOpen = () => setOpen(true);
    window.addEventListener("open-history-modal", onOpen);
    return () => window.removeEventListener("open-history-modal", onOpen);
  }, []);

  function addRow() {
    const ymd = prompt("Enter date YYYY-MM-DD", today);
    if (!ymd) return;
    const caloriesStr = prompt("Calories for date", "0");
    if (caloriesStr == null) return;
    const weightStr = prompt("Weight for date (optional)", "");
    const calories = Math.max(0, Math.floor(Number(caloriesStr) || 0));
    const weight = weightStr?.trim() ? Number(weightStr) : null;
    upsertHistoryRow({ date: ymd as YMD, calories, weight: Number.isFinite(weight!) ? weight! : null });
    refresh();
  }

  function editRow(date: string) {
    const currentCalories = readCaloriesFor(date);
    const currentWeight = readWeightFor(date);
    const caloriesStr = prompt("Edit calories", String(currentCalories));
    if (caloriesStr == null) return;
    const weightStr = prompt("Edit weight (blank to unset)", currentWeight == null ? "" : String(currentWeight));
    const calories = Math.max(0, Math.floor(Number(caloriesStr) || 0));
    const weight = weightStr?.trim() ? Number(weightStr) : null;
    writeCaloriesFor(date, calories);
    writeWeightFor(date, Number.isFinite(weight!) ? weight! : null);
    refresh();
  }

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div className="relative bg-white w-full md:max-w-2xl rounded-t-2xl md:rounded-xl border border-black/30 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">History</h3>
          <div className="flex items-center gap-2">
            <button className="underline text-sm focus-ring" onClick={addRow}>Add Row</button>
            <button className="h-8 px-3 rounded-md border border-black/30 focus-ring" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/30">
                <th className="py-2">Date</th>
                <th>Calories</th>
                <th>Weight</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-b border-black/10">
                  <td className="py-2 whitespace-nowrap">{formatDatePretty(r.date)}</td>
                  <td>{r.calories}</td>
                  <td>{r.weight == null ? "--" : r.weight}</td>
                  <td>
                    <button className="underline text-xs focus-ring" onClick={() => editRow(r.date)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



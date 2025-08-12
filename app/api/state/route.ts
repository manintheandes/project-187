import { NextRequest } from "next/server";

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

type State = { calories: number; weight: number | null };

function caloriesKey(date: string) {
  return `project187:calories:${date}`;
}

function weightKey(date: string) {
  return `project187:weight:${date}`;
}

async function kvGet(key: string): Promise<string | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result: string | null };
  return data?.result ?? null;
}

async function kvSet(key: string, value: string): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return new Response(JSON.stringify({ error: "missing date" }), { status: 400 });
  if (!KV_URL || !KV_TOKEN) return new Response("remote sync not configured", { status: 501 });

  const [c, w] = await Promise.all([kvGet(caloriesKey(date)), kvGet(weightKey(date))]);
  const state: State = {
    calories: Number(c || 0) || 0,
    weight: w == null ? null : Number(w),
  };
  return Response.json(state, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!KV_URL || !KV_TOKEN) return new Response("remote sync not configured", { status: 501 });
  const body = (await req.json()) as { date: string; calories?: number; weight?: number | null };
  if (!body?.date) return new Response(JSON.stringify({ error: "missing date" }), { status: 400 });

  const ops: Promise<void>[] = [];
  if (typeof body.calories === "number") ops.push(kvSet(caloriesKey(body.date), String(Math.max(0, Math.floor(body.calories)))));
  if (body.weight === null || typeof body.weight === "number") ops.push(kvSet(weightKey(body.date), body.weight == null ? "" : String(body.weight)));
  await Promise.all(ops);
  return Response.json({ ok: true });
}



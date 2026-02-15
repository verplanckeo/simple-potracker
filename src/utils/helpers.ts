import type { ID, PO, POComputed, Producer } from "../types/index.ts";

export function uid(prefix = "id"): ID {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function addDaysISO(iso: string, days: number): string {
  if (!iso) return iso;
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function stableStringify(obj: unknown): string {
  const seen = new WeakSet<object>();
  const sorter = (_key: string, value: unknown): unknown => {
    if (value && typeof value === "object") {
      const objValue = value as object;
      if (seen.has(objValue)) return "[Circular]";
      seen.add(objValue);
      if (Array.isArray(objValue)) return objValue;
      return Object.keys(objValue)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (objValue as Record<string, unknown>)[k];
          return acc;
        }, {});
    }
    return value;
  };
  return JSON.stringify(obj, sorter);
}

export const eur = new Intl.NumberFormat("nl-BE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function clampNonNegative(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

export function parseNumber(value: string): number {
  const normalized = value.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function computePO(po: PO, producerById: Map<ID, Producer>): POComputed {
  const dates = po.sessions
    .map((s) => s.date)
    .filter(Boolean)
    .sort();
  const startDate = dates[0] ?? "";
  const endDate = dates[dates.length - 1] ?? "";

  let price = 0;
  let profit = 0;
  const producerIdsSet = new Set<ID>();

  for (const s of po.sessions) {
    if (!s.producerId) continue;
    const pr = producerById.get(s.producerId);
    if (!pr) continue;
    const units = clampNonNegative(s.units ?? 0);
    price += units * (clampNonNegative(pr.rate) + clampNonNegative(pr.markup));
    profit += units * clampNonNegative(pr.markup);
    producerIdsSet.add(pr.id);
  }

  return {
    sessionCount: po.sessions.length,
    startDate,
    endDate,
    price,
    profit,
    producerIds: Array.from(producerIdsSet),
  };
}

export function formatDateRange(start: string, end: string): string {
  if (!start && !end) return "\u2014";
  if (start && !end) return start;
  if (!start && end) return end;
  if (start === end) return start;
  return `${start} \u2192 ${end}`;
}

export function safeName(map: Map<ID, { name: string }>, id: ID | ""): string {
  if (!id) return "\u2014";
  return map.get(id)?.name ?? "(missing)";
}

import type { ID, PO, POComputed, Producer, RateEntry, StoreV1 } from "../types/index";

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

export function computePO(po: PO, _producerById: Map<ID, Producer>): POComputed {
  const dates = po.sessions
    .map((s) => s.date)
    .filter(Boolean)
    .sort();
  const startDate = dates[0] ?? "";
  const endDate = dates[dates.length - 1] ?? "";

  let cost = 0;
  const producerIdsSet = new Set<ID>();

  for (const s of po.sessions) {
    if (!s.producerId) continue;
    const units = clampNonNegative(s.units ?? 0);
    // Rate and markup are snapshotted on the session at producer-assignment time
    cost += units * (clampNonNegative(s.rate ?? 0) + clampNonNegative(s.markup ?? 0));
    producerIdsSet.add(s.producerId);
  }

  const profit = (po.price ?? 0) - cost;

  return {
    sessionCount: po.sessions.length,
    startDate,
    endDate,
    cost,
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

export function nowISO(): string {
  return new Date().toISOString();
}

export function findActiveRate(rateHistory: RateEntry[], date: string): RateEntry | undefined {
  if (rateHistory.length === 0) return undefined;
  const sorted = [...rateHistory].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  for (const entry of sorted) {
    if (entry.effectiveFrom <= date) return entry;
  }
  return sorted[sorted.length - 1];
}

export function currentRate(rateHistory: RateEntry[]): RateEntry | undefined {
  if (rateHistory.length === 0) return undefined;
  return [...rateHistory].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

export interface RecalculateResult {
  updatedSessions: number;
  updatedPOs: number;
  skippedNoDate: number;
  skippedNoProducer: number;
}

export function recalculateAllSessions(
  store: StoreV1,
): { nextStore: StoreV1; result: RecalculateResult } {
  const producerById = new Map(store.producers.map((p) => [p.id, p]));
  let updatedSessions = 0;
  let updatedPOCount = 0;
  let skippedNoDate = 0;
  let skippedNoProducer = 0;

  const pos = store.pos.map((po) => {
    let poChanged = false;
    const sessions = po.sessions.map((s) => {
      if (!s.date) { skippedNoDate++; return s; }
      if (!s.producerId) { skippedNoProducer++; return s; }
      const producer = producerById.get(s.producerId);
      if (!producer) { skippedNoProducer++; return s; }
      const entry = findActiveRate(producer.rateHistory, s.date);
      const newRate = entry?.rate ?? producer.rate;
      const newMarkup = entry?.markup ?? producer.markup;
      if (s.rate === newRate && s.markup === newMarkup) return s;
      poChanged = true;
      updatedSessions++;
      return { ...s, rate: newRate, markup: newMarkup };
    });
    if (poChanged) updatedPOCount++;
    return poChanged ? { ...po, sessions } : po;
  });

  return {
    nextStore: { ...store, pos },
    result: { updatedSessions, updatedPOs: updatedPOCount, skippedNoDate, skippedNoProducer },
  };
}

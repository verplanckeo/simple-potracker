import type { StoreV1, Training, Customer, Producer, PO, POStatus } from "../types/index";
import { uid, todayISO, addDaysISO, nowISO } from "./helpers";

const STORAGE_KEY = "po-tracker-store-v1";

function seedStore(): StoreV1 {
  const t1: Training = { id: uid("tr"), name: "Aspire to lead" };
  const t2: Training = { id: uid("tr"), name: "AI in the workplace" };
  const c1: Customer = { id: uid("cu"), name: "Essity" };
  const c2: Customer = { id: uid("cu"), name: "Nestlé" };
  const p1: Producer = {
    id: uid("pr"), name: "John Wick", rate: 650, markup: 150,
    rateHistory: [{ id: uid("re"), rate: 650, markup: 150, effectiveFrom: "2025-01-01", lastModified: nowISO() }],
  };
  const p2: Producer = {
    id: uid("pr"), name: "Samira El Amrani", rate: 600, markup: 200,
    rateHistory: [{ id: uid("re"), rate: 600, markup: 200, effectiveFrom: "2025-01-01", lastModified: nowISO() }],
  };

  const po1: PO = {
    id: uid("po"),
    poNumber: "PO-2026-001",
    trainingId: t2.id,
    customerId: c1.id,
    status: "draft",
    price: 0,
    sessions: [
      { id: uid("se"), date: addDaysISO(todayISO(), 7), producerId: p1.id, units: 1, rate: p1.rate, markup: p1.markup },
      { id: uid("se"), date: addDaysISO(todayISO(), 14), producerId: p1.id, units: 1, rate: p1.rate, markup: p1.markup },
    ],
  };

  return {
    version: 1,
    trainings: [t1, t2],
    customers: [c1, c2],
    producers: [p1, p2],
    pos: [po1],
  };
}

export function loadStore(): StoreV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedStore();
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      (parsed as Record<string, unknown>)["version"] !== 1
    ) {
      return seedStore();
    }
    return migrateAll(parsed as StoreV1);
  } catch {
    return seedStore();
  }
}

function migrateProducers(store: StoreV1): StoreV1 {
  const producers = store.producers.map((p) => {
    const raw = p as unknown as Record<string, unknown>;
    if (Array.isArray(raw["rateHistory"]) && (raw["rateHistory"] as unknown[]).length > 0) {
      return p;
    }
    return {
      ...p,
      rateHistory: [{
        id: uid("re"),
        rate: p.rate,
        markup: p.markup,
        effectiveFrom: "2000-01-01",
        lastModified: nowISO(),
      }],
    };
  });
  return { ...store, producers };
}

function migratePOs(store: StoreV1): StoreV1 {
  const producerById = new Map(store.producers.map((p) => [p.id, p]));

  const pos = store.pos.map((po) => ({
    ...po,
    status: (po.status ?? "draft") as POStatus,
    sessions: po.sessions.map((s) => {
      // Backfill rate/markup from current producer if missing (pre-snapshot data)
      const raw = s as unknown as Record<string, unknown>;
      if (raw["rate"] === undefined || raw["rate"] === null) {
        const producer = s.producerId ? producerById.get(s.producerId) : undefined;
        return { ...s, rate: producer?.rate ?? 0, markup: producer?.markup ?? 0 };
      }
      return s;
    }),
  }));
  return { ...store, pos };
}

function migrateAll(store: StoreV1): StoreV1 {
  return migratePOs(migrateProducers(store));
}

export function migrateStore(store: StoreV1): StoreV1 {
  return migrateAll(store);
}

export function saveStore(store: StoreV1): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

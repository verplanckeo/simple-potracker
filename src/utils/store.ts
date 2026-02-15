import type { StoreV1 } from "../types/index.ts";
import { uid, todayISO, addDaysISO } from "./helpers.ts";
import type { Training, Customer, Producer, PO, POStatus } from "../types/index.ts";

const STORAGE_KEY = "po-tracker-store-v1";

function seedStore(): StoreV1 {
  const t1: Training = { id: uid("tr"), name: "Aspire to lead" };
  const t2: Training = { id: uid("tr"), name: "AI in the workplace" };
  const c1: Customer = { id: uid("cu"), name: "Essity" };
  const c2: Customer = { id: uid("cu"), name: "Nestlé" };
  const p1: Producer = { id: uid("pr"), name: "Alex Johnson", rate: 650, markup: 150 };
  const p2: Producer = { id: uid("pr"), name: "Samira El Amrani", rate: 600, markup: 200 };

  const po1: PO = {
    id: uid("po"),
    poNumber: "PO-2026-001",
    trainingId: t2.id,
    customerId: c1.id,
    status: "draft",
    sessions: [
      { id: uid("se"), date: addDaysISO(todayISO(), 7), producerId: p1.id, units: 1 },
      { id: uid("se"), date: addDaysISO(todayISO(), 14), producerId: p1.id, units: 1 },
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
      (parsed as Record<string, unknown>).version !== 1
    ) {
      return seedStore();
    }
    return migratePOs(parsed as StoreV1);
  } catch {
    return seedStore();
  }
}

function migratePOs(store: StoreV1): StoreV1 {
  const pos = store.pos.map((po) => ({
    ...po,
    status: (po.status ?? "draft") as POStatus,
  }));
  return { ...store, pos };
}

export function saveStore(store: StoreV1): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

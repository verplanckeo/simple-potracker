import { useState, useMemo, useCallback } from "react";
import type { ID, PO, POComputed } from "../types/index";

export type PoSortKey =
  | "poNumber"
  | "status"
  | "training"
  | "customer"
  | "producerCount"
  | "sessionCount"
  | "price"
  | "profit"
  | "startDate"
  | "endDate";

export type SortDir = "asc" | "desc";

interface UsePoSortOptions {
  filtered: PO[];
  computedByPoId: Map<ID, POComputed>;
  trainingNameById: (id: ID | "") => string;
  customerNameById: (id: ID | "") => string;
}

interface UsePoSortReturn {
  sortKey: PoSortKey | null;
  sortDir: SortDir;
  sorted: PO[];
  isSorting: boolean;
  toggleSort: (key: PoSortKey) => void;
  setSort: (key: PoSortKey | null, dir?: SortDir) => void;
  clearSort: () => void;
}

export function usePoSort({
  filtered,
  computedByPoId,
  trainingNameById,
  customerNameById,
}: UsePoSortOptions): UsePoSortReturn {
  const [sortKey, setSortKey] = useState<PoSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = useCallback((key: PoSortKey): void => {
    // Cycle: asc → desc → clear
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey, sortDir]);

  const setSort = useCallback((key: PoSortKey | null, dir: SortDir = "asc"): void => {
    setSortKey(key);
    setSortDir(dir);
  }, []);

  const clearSort = useCallback((): void => {
    setSortKey(null);
    setSortDir("asc");
  }, []);

  const sorted = useMemo((): PO[] => {
    if (!sortKey) return filtered;

    const copy = [...filtered];

    copy.sort((a, b) => {
      const ca = computedByPoId.get(a.id);
      const cb = computedByPoId.get(b.id);

      let cmp = 0;

      switch (sortKey) {
        case "poNumber":
          cmp = a.poNumber.localeCompare(b.poNumber, undefined, { numeric: true });
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "training":
          cmp = trainingNameById(a.trainingId).localeCompare(trainingNameById(b.trainingId));
          break;
        case "customer":
          cmp = customerNameById(a.customerId).localeCompare(customerNameById(b.customerId));
          break;
        case "producerCount":
          cmp = (ca?.producerIds.length ?? 0) - (cb?.producerIds.length ?? 0);
          break;
        case "sessionCount":
          cmp = (ca?.sessionCount ?? 0) - (cb?.sessionCount ?? 0);
          break;
        case "price":
          cmp = (ca?.price ?? 0) - (cb?.price ?? 0);
          break;
        case "profit":
          cmp = (ca?.profit ?? 0) - (cb?.profit ?? 0);
          break;
        case "startDate":
          cmp = (ca?.startDate ?? "").localeCompare(cb?.startDate ?? "");
          break;
        case "endDate":
          cmp = (ca?.endDate ?? "").localeCompare(cb?.endDate ?? "");
          break;
      }

      // Stable tiebreaker: use array index identity via id
      if (cmp === 0) cmp = a.id.localeCompare(b.id);

      return sortDir === "asc" ? cmp : -cmp;
    });

    return copy;
  }, [filtered, sortKey, sortDir, computedByPoId, trainingNameById, customerNameById]);

  return {
    sortKey,
    sortDir,
    sorted,
    isSorting: sortKey !== null,
    toggleSort,
    setSort,
    clearSort,
  };
}

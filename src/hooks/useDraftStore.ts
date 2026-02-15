import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { StoreV1 } from "../types/index";
import { stableStringify } from "../utils/helpers";
import { loadStore, saveStore } from "../utils/store";

type SaveStatus = "idle" | "saving" | "saved";

const AUTO_SAVE_KEY = "po-tracker-auto-save";
const AUTO_SAVE_DELAY = 1500;
const SAVED_DISPLAY_DURATION = 2000;

function loadAutoSavePref(): boolean {
  const stored = localStorage.getItem(AUTO_SAVE_KEY);
  return stored === null ? true : stored === "true";
}

interface DraftStore {
  persisted: StoreV1;
  draft: StoreV1;
  setDraft: Dispatch<SetStateAction<StoreV1>>;
  dirty: boolean;
  save: () => void;
  discard: () => void;
  autoSave: boolean;
  setAutoSave: (on: boolean) => void;
  saveStatus: SaveStatus;
}

export function useDraftStore(): DraftStore {
  const [persisted, setPersisted] = useState<StoreV1>(() => loadStore());
  const [draft, setDraft] = useState<StoreV1>(() => loadStore());
  const [autoSave, setAutoSaveState] = useState(loadAutoSavePref);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = useMemo(() => {
    return stableStringify(persisted) !== stableStringify(draft);
  }, [persisted, draft]);

  const doSave = useCallback((data: StoreV1) => {
    setSaveStatus("saving");
    saveStore(data);
    setPersisted(data);

    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => {
      setSaveStatus("saved");
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, SAVED_DISPLAY_DURATION);
    }, 300);
  }, []);

  const save = useCallback(() => {
    doSave(draft);
  }, [draft, doSave]);

  const discard = useCallback(() => {
    setDraft(persisted);
  }, [persisted]);

  const setAutoSave = useCallback((on: boolean) => {
    setAutoSaveState(on);
    localStorage.setItem(AUTO_SAVE_KEY, String(on));
  }, []);

  useEffect(() => {
    if (!autoSave || !dirty) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSave(draft);
    }, AUTO_SAVE_DELAY);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [autoSave, dirty, draft, doSave]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { persisted, draft, setDraft, dirty, save, discard, autoSave, setAutoSave, saveStatus };
}

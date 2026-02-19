import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMsal } from "@azure/msal-react";
import { toast } from "sonner";
import type { StoreV1 } from "../types/index";
import { stableStringify } from "../utils/helpers";
import { loadStore, saveStore } from "../utils/store";
import { saveToCloud, loadFromCloud, classifyCloudError } from "../services/tableStorageService";

type SaveStatus = "idle" | "saving" | "saved";

const AUTO_SAVE_KEY = "po-tracker-auto-save";
const AUTO_SAVE_DELAY = 1500;
const SAVED_DISPLAY_DURATION = 2000;
const CLOUD_SLOW_THRESHOLD = 2000;

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
  manualSync: () => void;
}

export function useDraftStore(): DraftStore {
  const { instance } = useMsal();
  const [persisted, setPersisted] = useState<StoreV1>(() => loadStore());
  const [draft, setDraft] = useState<StoreV1>(() => loadStore());
  const [autoSave, setAutoSaveState] = useState(loadAutoSavePref);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudSyncRef = useRef<AbortController | null>(null);
  const latestDraftRef = useRef(draft);
  latestDraftRef.current = draft;

  const dirty = useMemo(() => {
    return stableStringify(persisted) !== stableStringify(draft);
  }, [persisted, draft]);

  const syncToCloud = useCallback(async (data: StoreV1, isRetry = false): Promise<void> => {
    if (cloudSyncRef.current) {
      cloudSyncRef.current.abort();
    }
    const controller = new AbortController();
    cloudSyncRef.current = controller;

    let slowToastId: string | number | undefined;
    const slowTimer = setTimeout(() => {
      if (!controller.signal.aborted) {
        slowToastId = toast.warning("Syncing to cloud...", { duration: Infinity });
      }
    }, CLOUD_SLOW_THRESHOLD);

    try {
      await saveToCloud(instance, data);

      if (controller.signal.aborted) return;

      clearTimeout(slowTimer);
      if (slowToastId !== undefined) {
        toast.dismiss(slowToastId);
      }

      if (isRetry) {
        toast.success("Sync successful", { duration: 2000 });
      } else {
        toast.success("Changes synced to cloud", { duration: 2000 });
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) return;

      clearTimeout(slowTimer);
      if (slowToastId !== undefined) {
        toast.dismiss(slowToastId);
      }

      const message = classifyCloudError(error);
      toast.error("Failed to sync to cloud", {
        description: message,
        duration: Infinity,
        action: {
          label: "Retry",
          onClick: () => { void syncToCloud(latestDraftRef.current, true); },
        },
      });
    } finally {
      if (cloudSyncRef.current === controller) {
        cloudSyncRef.current = null;
      }
    }
  }, [instance]);

  const doSave = useCallback((data: StoreV1) => {
    setSaveStatus("saving");
    saveStore(data);
    setPersisted(data);

    void syncToCloud(data);

    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => {
      setSaveStatus("saved");
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, SAVED_DISPLAY_DURATION);
    }, 300);
  }, [syncToCloud]);

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

  const manualSync = useCallback(() => {
    void syncToCloud(latestDraftRef.current, true);
  }, [syncToCloud]);

  // Load from cloud on mount — use cloud data if available
  useEffect(() => {
    let cancelled = false;

    async function loadCloud(): Promise<void> {
      try {
        const result = await loadFromCloud(instance);
        if (cancelled || !result) return;

        const localJson = stableStringify(loadStore());
        const cloudJson = stableStringify(result.store);

        if (localJson !== cloudJson) {
          setDraft(result.store);
          setPersisted(result.store);
          saveStore(result.store);
        }
      } catch {
        // Silently fail on initial load — localStorage is the fallback
      }
    }

    void loadCloud();

    return () => { cancelled = true; };
  }, [instance]);

  // Auto-save debounce
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

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      if (cloudSyncRef.current) cloudSyncRef.current.abort();
    };
  }, []);

  return { persisted, draft, setDraft, dirty, save, discard, autoSave, setAutoSave, saveStatus, manualSync };
}

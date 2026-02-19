/**
 * Azure Table Storage service for cloud persistence.
 *
 * Data isolation strategy:
 *   partitionKey = user's stable account ID (localAccountId)
 *   rowKey       = data type identifier (e.g. "store-v1")
 *
 * Every operation is automatically scoped to the current user's partition.
 * Users cannot accidentally read or write another user's data because all
 * queries target a single (partitionKey, rowKey) pair. This also gives
 * optimal Table Storage performance since partition-level lookups are O(1).
 */

import { TableClient } from "@azure/data-tables";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import type { StoreV1 } from "../types/index";

const STORAGE_ACCOUNT = import.meta.env["VITE_STORAGE_ACCOUNT_NAME"] ?? "";
const TABLE_NAME = import.meta.env["VITE_TABLE_NAME"] ?? "potracker";
const ROW_KEY = "store-v1";
const MAX_PROPERTY_SIZE = 32_000;
const STORAGE_SCOPES = ["https://storage.azure.com/user_impersonation"];

// ---------------------------------------------------------------------------
// User identity
// ---------------------------------------------------------------------------

/**
 * Returns a stable, unique identifier for the authenticated user.
 * Uses localAccountId (object ID in the tenant) which never changes,
 * unlike email or UPN which can be renamed.
 */
function getUserIdentifier(account: AccountInfo): string {
  const id = account.localAccountId ?? account.homeAccountId ?? "";
  if (!id) {
    throw new Error("No authenticated account");
  }
  // Table Storage keys must be safe: no /, \, #, ?  and max 1 KB.
  return id.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getAuthenticatedAccount(instance: IPublicClientApplication): AccountInfo {
  const account = instance.getAllAccounts()[0];
  if (!account) {
    throw new Error("Authentication expired. Please log in again.");
  }
  return account;
}

// ---------------------------------------------------------------------------
// Token & client helpers
// ---------------------------------------------------------------------------

function getTableUrl(): string {
  return `https://${STORAGE_ACCOUNT}.table.core.windows.net`;
}

async function getStorageToken(instance: IPublicClientApplication): Promise<string> {
  const account = getAuthenticatedAccount(instance);

  try {
    const response = await instance.acquireTokenSilent({
      scopes: STORAGE_SCOPES,
      account,
    });
    return response.accessToken;
  } catch (error: unknown) {
    if (error instanceof InteractionRequiredAuthError) {
      const response = await instance.acquireTokenPopup({
        scopes: STORAGE_SCOPES,
        account,
      });
      return response.accessToken;
    }
    throw error;
  }
}

function createTableClient(token: string): TableClient {
  return new TableClient(
    getTableUrl(),
    TABLE_NAME,
    { getToken: () => Promise.resolve({ token, expiresOnTimestamp: Date.now() + 3600_000 }) },
  );
}

// ---------------------------------------------------------------------------
// Chunking (Table Storage has a 64 KB property limit; we use 32 KB to be safe)
// ---------------------------------------------------------------------------

function chunkString(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Entity shape
// ---------------------------------------------------------------------------

interface StoreEntity {
  partitionKey: string;
  rowKey: string;
  updatedAt: string;
  chunkCount: number;
  version: string;
  [key: string]: string | number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function saveToCloud(
  instance: IPublicClientApplication,
  store: StoreV1,
): Promise<void> {
  const account = getAuthenticatedAccount(instance);
  const partitionKey = getUserIdentifier(account);
  const token = await getStorageToken(instance);
  const client = createTableClient(token);

  const json = JSON.stringify(store);
  const chunks = chunkString(json, MAX_PROPERTY_SIZE);

  const entity: StoreEntity = {
    partitionKey,
    rowKey: ROW_KEY,
    updatedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    version: "1.0",
  };

  for (let i = 0; i < chunks.length; i++) {
    entity[`data_${i}`] = chunks[i]!;
  }

  await client.upsertEntity(entity, "Replace");
}

export interface CloudStoreResult {
  store: StoreV1;
  updatedAt: string;
}

export async function loadFromCloud(
  instance: IPublicClientApplication,
): Promise<CloudStoreResult | null> {
  const account = getAuthenticatedAccount(instance);
  const partitionKey = getUserIdentifier(account);
  const token = await getStorageToken(instance);
  const client = createTableClient(token);

  try {
    const entity = await client.getEntity<StoreEntity>(partitionKey, ROW_KEY);
    const chunkCount = entity.chunkCount as number;
    let json = "";
    for (let i = 0; i < chunkCount; i++) {
      json += entity[`data_${i}`] as string;
    }

    const parsed: unknown = JSON.parse(json);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      (parsed as Record<string, unknown>)["version"] !== 1
    ) {
      return null;
    }

    return {
      store: parsed as StoreV1,
      updatedAt: entity.updatedAt as string,
    };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      (error as { statusCode: number }).statusCode === 404
    ) {
      return null;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

export function classifyCloudError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes("authentication expired") || msg.includes("log in again")) {
      return "Authentication expired. Please log in again.";
    }
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
      return "Network error. Changes saved locally.";
    }
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error
    ) {
      const status = (error as { statusCode: number }).statusCode;
      if (status === 401 || status === 403) {
        return "Permission denied. Contact administrator.";
      }
    }
    return `Sync failed: ${error.message}`;
  }
  return "Sync failed: Unknown error";
}

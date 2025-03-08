// src/lib/contractStorage.ts
import { Buffer } from "buffer";
import { deserializeUserData, UserData } from "./borshSchema";

// For your contract
const CONTRACT_ID = "linkoftrust.testnet";
const RPC_URL = "https://rpc.testnet.near.org";

/**
 * Fetch the entire contract state via NEAR RPC (view_state).
 * @returns The raw JSON from RPC, or throws on error.
 */
export async function fetchContractStorage(): Promise<any> {
  const requestBody = {
    jsonrpc: "2.0",
    id: "storage",
    method: "query",
    params: {
      request_type: "view_state",
      finality: "final",
      account_id: CONTRACT_ID,
      prefix_base64: "", // fetch all keys
    },
  };

  const resp = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  const data = await resp.json();
  if (data.error) {
    throw new Error(`RPC Error: ${JSON.stringify(data.error)}`);
  }

  return data.result;
}

/**
 * Parse the raw contract storage JSON, decode any `UserData` entries, and return them as objects.
 * 
 * For example, if your contract stores user data under prefix `u` (0x75), 
 * we look for keys that start with 0x75 and decode them with `deserializeUserData`.
 */
export function parseUsersFromStorage(viewState: any): UserData[] {
  const values = viewState.values || [];
  const userList: UserData[] = [];

  for (const item of values) {
    const keyBytes = Buffer.from(item.key, "base64");
    const valueBytes = Buffer.from(item.value, "base64");

    // If your prefix is 'u' => 0x75
    if (keyBytes[0] === 0x75) {
      try {
        const userData = deserializeUserData(new Uint8Array(valueBytes));
        userList.push(userData);
      } catch (err) {
        // If decoding fails, skip or log
        console.warn("Failed to decode user data for key:", item.key, err);
      }
    }
  }

  return userList;
}

/**
 * Convenience method that fetches the raw state and decodes user data in one go.
 */
export async function getAllUsers(): Promise<UserData[]> {
  const storage = await fetchContractStorage();
  return parseUsersFromStorage(storage);
}

// src/contractData.ts

import { FinalExecutionOutcome, Wallet } from "@near-wallet-selector/core";
import { connect, keyStores } from "near-api-js";
import bs58 from "bs58";

/**
 * Interface for the JSON-based user data returned by the contract.
 * Ensure that your contract’s get_user_data view method returns data
 * in this format.
 */
export interface UserDataView {
  hashed_user_id: string;          // base58 hashed user id
  requested_trust_cost: string;    // near token (yoctoNEAR) as a string
  public_profile: string;
  private_profile: Array<[string, string]>;
  trust_network: Array<[string, number]>;
  trust_requests: Array<[string, [string, number]]>;
  blocked_requests: Array<[string, string]>;
  accepted_deposits: Array<[string, string]>;
  user_id?: string;
}

/**
 * Computes the hashed user id from an account id using SHA‑256 and bs58 encoding.
 * This replicates what the contract does in HashedUserId::from_account_id.
 *
 * @param accountId - The NEAR account id (e.g. "alice.testnet").
 * @returns A Promise that resolves to a base58‑encoded hash string.
 */
export async function hashAccountId(accountId: string): Promise<string> {
  const msg = new TextEncoder().encode(accountId);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msg);
  const hashArray = new Uint8Array(hashBuffer);
  return bs58.encode(hashArray);
}

/**
 * Calls the contract’s view method "get_user_data" using the RPC API.
 * See: https://docs.near.org/api/rpc/contracts#call-a-contract-function
 *
 * @param contractId - The contract's account id (e.g. "linkoftrust.testnet").
 * @param userId - The input to the contract’s get_user_data method.
 *                 IMPORTANT: This should be the base58‑encoded hash (from SHA‑256)
 *                 of the real account id.
 * @param network - The NEAR network ("testnet" or "mainnet").
 * @returns A Promise resolving to the UserDataView or null if not found.
 */
export async function getUserData(
  contractId: string,
  userId: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<UserDataView | null> {
  try {
    const config = {
      networkId: network,
      keyStore: new keyStores.InMemoryKeyStore(), // empty key store, since we only do view calls
      nodeUrl:
        network === "testnet"
          ? "https://rpc.testnet.near.org"
          : "https://rpc.mainnet.near.org",
      walletUrl:
        network === "testnet" ? "https://wallet.testnet.near.org" : "https://app.near.org",
      helperUrl:
        network === "testnet"
          ? "https://helper.testnet.near.org"
          : "https://helper.mainnet.near.org",
      explorerUrl:
        network === "testnet"
          ? "https://explorer.testnet.near.org"
          : "https://explorer.near.org",
    };
    const near = await connect(config);
    // Use a dummy account for view calls
    const account = await near.account("dontcare.testnet");
    // Use the object-style options for viewFunction
    const result = await account.viewFunction({
      contractId,
      methodName: "get_user_data",
      args: { user_id: userId },
      // Optionally, you can pass parse/stringify options if needed.
    });
    return result as UserDataView;
  } catch (err) {
    console.error("Error calling get_user_data:", err);
    return null;
  }
}

/**
 * Polls data for the currently signed-in user.
 *  - Computes the hashed user id from the account id.
 *  - Calls getUserData to fetch that user’s data.
 *
 * @param wallet - A connected Wallet from wallet-selector.
 * @param contractId - The contract's account id.
 * @param network - The NEAR network ("testnet" or "mainnet").
 * @returns A Promise resolving to the UserDataView (or null if no record).
 */
export async function pollMyUser(
  accountid: string,
  contractId: string,
  network: "testnet" | "mainnet"
): Promise<UserDataView | null> {
  const hashed = await hashAccountId(accountid);
  return getUserData(contractId, hashed, network);
}

/**
 * Polls data for a given list of user hashed IDs.
 * For each hashed id provided, calls getUserData.
 *
 * @param contractId - The contract's account id.
 * @param hashedIds - An array of base58‑encoded hashed user IDs.
 * @param network - The NEAR network ("testnet" or "mainnet").
 * @returns A Promise resolving to a Map mapping each hashed id to its UserDataView.
 */
export async function pollUsers(
  contractId: string,
  hashedIds: string[],
  network: "testnet" | "mainnet" = "testnet"
): Promise<Map<string, UserDataView>> {
  const result = new Map<string, UserDataView>();
  for (const hashed of hashedIds) {
    const data = await getUserData(contractId, hashed, network);
    if (data !== null) {
      result.set(hashed, data);
    }
  }
  return result;
}

/**
 * Polls all users.
 * If your contract exposes a view method (e.g. "view_users") that returns all user hashed IDs,
 * then this function will call it and return the list.
 *
 * @param contractId - The contract's account id.
 * @param network - The NEAR network ("testnet" or "mainnet").
 * @returns A Promise resolving to an array of user hashed IDs.
 */
export async function pollAllUsers(
  contractId: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<string[]> {
  try {
    const config = {
      networkId: network,
      keyStore: new keyStores.InMemoryKeyStore(),
      nodeUrl:
        network === "testnet"
          ? "https://rpc.testnet.near.org"
          : "https://rpc.mainnet.near.org",
      walletUrl:
        network === "testnet" ? "https://wallet.testnet.near.org" : "https://app.near.org",
      helperUrl:
        network === "testnet"
          ? "https://helper.testnet.near.org"
          : "https://helper.mainnet.near.org",
      explorerUrl:
        network === "testnet"
          ? "https://explorer.testnet.near.org"
          : "https://explorer.near.org",
    };
    const near = await connect(config);
    const account = await near.account("dontcare.testnet");
    const all: string[] = await account.viewFunction({
      contractId,
      methodName: "view_users",
      args: {},
    });
    return all;
  } catch (err) {
    console.error("Error calling view_users:", err);
    return [];
  }
}

/* New transaction wrappers using wallet-selector syntax */

/**
 * Calls the "untrust" method on the contract.
 *
 * @param wallet - A connected wallet from wallet-selector.
 * @param contractId - The contract's account ID (e.g. "linkoftrust.testnet").
 * @param hashedUserId - The base58‑encoded hashed user ID.
 * @param maxGas - Maximum gas in TGas (e.g., 10 means 10 TGas).
 * @param maxDeposit - Maximum deposit in NEAR (e.g., 0.01 means 0.01 NEAR).
 * @returns The transaction outcome.
 */
export function untrustAction(
  wallet: Wallet,
  contractId: string,
  hashedUserId: string,
  maxGas: number,
  maxDeposit: number
): Promise<FinalExecutionOutcome | void> {
  return wallet.signAndSendTransaction({
    receiverId: contractId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "untrust",
          args: { user_id: hashedUserId },
          gas: BigInt(Math.floor(maxGas * 1e12)).toString(),
          deposit: BigInt(Math.floor(maxDeposit * 1e24)).toString(),
        },
      },
    ],
  });
}

/**
 * Calls the "trust" method on the contract.
 *
 * @param wallet - A connected wallet from wallet-selector.
 * @param contractId - The contract's account ID.
 * @param hashedUserId - The base58‑encoded hashed user ID.
 * @param level - The trust level (e.g., 1.0).
 * @param maxGas - Maximum gas in TGas.
 * @param maxDeposit - Maximum deposit in NEAR.
 * @returns The transaction outcome.
 */
export function trustAction(
  wallet: Wallet,
  contractId: string,
  hashedUserId: string,
  level: number,
  maxGas: number,
  maxDeposit: number
): Promise<FinalExecutionOutcome | void> {
  return wallet.signAndSendTransaction({
    receiverId: contractId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "trust",
          args: { user_id: hashedUserId, level },
          gas: BigInt(Math.floor(maxGas * 1e12)).toString(),
          deposit: BigInt(Math.floor(maxDeposit * 1e24)).toString(),
        },
      },
    ],
  });
}

/**
 * Calls the "modify_public_profile" method on the contract.
 *
 * @param wallet - A connected wallet from wallet-selector.
 * @param contractId - The contract's account ID.
 * @param currentContent - The new public profile content.
 * @param maxGas - Maximum gas in TGas.
 * @param maxDeposit - Maximum deposit in NEAR.
 * @returns The transaction outcome.
 */
export async function modifyPublicProfile(
  wallet: Wallet,
  contractId: string,
  currentContent: string,
  maxGas: number,
  maxDeposit: number
): Promise<any> {
  // Ensure the values are valid numbers
  const gasValue = Number(maxGas);
  const depositValue = Number(maxDeposit);
  
  if (isNaN(gasValue) || isNaN(depositValue)) {
    throw new Error("Invalid gas or deposit value");
  }
  
  const gasAmount = BigInt(Math.floor(gasValue * 1e12)).toString();
  const depositAmount = BigInt(Math.floor(depositValue * 1e24)).toString();
  console.log(`Gas Amount: ${gasAmount}`);
  console.log(`Deposit Amount: ${depositAmount}`);

  return wallet.signAndSendTransaction({
    receiverId: contractId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "modify_public_profile",
          args: { profile: currentContent },
          gas: gasAmount,
          deposit: depositAmount,
        },
      },
    ],
  });
}

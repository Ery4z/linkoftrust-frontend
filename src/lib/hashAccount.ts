import { sha256 } from 'js-sha256';
import bs58 from 'bs58';

/**
 * Returns the base58-encoded SHA-256 hash of a NEAR accountId.
 * 
 * This matches the `HashedUserId` logic in your contract.
 *
 * @param accountId e.g. "alice.testnet"
 * @returns a base58 string
 */
export function getBs58HashedUserId(accountId: string): string {
  // 1. Hash the string with SHA-256 => get bytes
  const hashedBytes = new Uint8Array(sha256.array(accountId));
  
  // 2. Convert to base58 string
  const base58String = bs58.encode(hashedBytes);

  return base58String;
}

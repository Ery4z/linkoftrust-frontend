// src/lib/iterableMapParser.ts

import { Buffer } from "buffer";

/**
 * Minimal shape of a single 'view_state' RPC call result:
 * {
 *   values: Array<{ key: string; value: string }>
 *   block_hash: string
 *   block_height: number
 * }
 */
export interface ContractViewState {
  values: Array<{ key: string; value: string }>;
  block_hash: string;
  block_height: number;
}

/** 
 * Basic Rust-like classes we parse in sub-map values:
 * - NearToken (like { yocto: string })
 * - TrustRequest => { deposit: NearToken, expiry: u64 }
 */
export class NearToken {
  yocto!: string;
  constructor(fields: Partial<NearToken> = {}) {
    Object.assign(this, fields);
  }
}

export class TrustRequest {
  deposit!: NearToken;
  expiry!: bigint;
  constructor(fields: Partial<TrustRequest> = {}) {
    Object.assign(this, fields);
  }
}

export class HashedUserId {
  s_bs58!: string;
  constructor(fields: Partial<HashedUserId> = {}) {
    Object.assign(this, fields);
  }
}

/** ----------------------
 *  Borsh Utility Readers
 *  to parse sub-key or sub-value from a NEAR approach
 * --------------------- */

function readU32LE(bytes: Uint8Array, offset: number): [number, number] {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const val = dv.getUint32(offset, true); // little-endian
  return [val, offset + 4];
}

function readU64LE(bytes: Uint8Array, offset: number): [bigint, number] {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const low = dv.getUint32(offset, true);
  const high = dv.getUint32(offset + 4, true);
  const combined = BigInt(low) + (BigInt(high) << 32n);
  return [combined, offset + 8];
}

function readF32LE(bytes: Uint8Array, offset: number): [number, number] {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const val = dv.getFloat32(offset, true);
  return [val, offset + 4];
}

/** 
 * Borsh string => (u32 length) + that many UTF-8 bytes.
 */
function readString(bytes: Uint8Array, offset: number): [string, number] {
  let [length, off] = readU32LE(bytes, offset);
  const slice = bytes.subarray(off, off + length);
  const text = new TextDecoder().decode(slice);
  return [text, off + length];
}

/**
 * Parse a HashedUserId from the leftover of the key (Borsh string).
 */
function parseHashedUserKey(keyBytes: Uint8Array, prefixLen: number): string {
  // skip prefixLen, then read a Borsh-serialized string => s_bs58
  let offset = prefixLen;
  const [s_bs58, newOff] = readString(keyBytes, offset);
  return s_bs58;
}

/**
 * Parse a Borsh-serialized string value => typical for `private_profile`.
 */
function parseStringValue(valueBytes: Uint8Array): string {
  let offset = 0;
  const [str, newOff] = readString(valueBytes, offset);
  return str;
}

/**
 * Parse a Borsh-serialized f32 => typical for `trust_network`.
 */
function parseF32Value(valueBytes: Uint8Array): number {
  let offset = 0;
  const [val, off2] = readF32LE(valueBytes, offset);
  return val;
}

/**
 * If your contract stores a `NearToken` as a Borsh string, 
 * then parseNearTokenValue => readString => new NearToken({ yocto })
 * If it actually stores raw 16 bytes for u128, adapt accordingly.
 */
function parseNearTokenValue(valueBytes: Uint8Array): NearToken {
  // Example: stored as Borsh string
  let offset = 0;
  const [str, off2] = readString(valueBytes, offset);
  return new NearToken({ yocto: str });
}

/**
 * Parse a Borsh-serialized TrustRequest => deposit (NearToken) + expiry (u64).
 */
function parseTrustRequestValue(valueBytes: Uint8Array): TrustRequest {
  let offset = 0;
  // deposit => parseNearTokenValue
  const [depStr, off1] = readString(valueBytes, offset);
  const deposit = new NearToken({ yocto: depStr });

  const [expiry, off2] = readU64LE(valueBytes, off1);
  return new TrustRequest({ deposit, expiry });
}

/** 
 * Generic sub-map parser for => map: <HashedUserId.s_bs58, ValueType>
 * - We match keys that start with prefixBase64
 * - The sub-key = leftover => parseHashedUserKey
 * - The value => parseValue
 */
function parseSubMap<ValueType>(
  prefixBase64: string,
  contractState: ContractViewState,
  parseValue: (vBytes: Uint8Array) => ValueType,
  parseKeySuffix: (kBytes: Uint8Array, prefixLen: number) => string = parseHashedUserKey,
): Map<string, ValueType> {
  const result = new Map<string, ValueType>();
  const prefix = Buffer.from(prefixBase64, "base64"); // actual bytes of prefix

  for (const { key, value } of contractState.values) {
    const kBytes = Buffer.from(key, "base64");
    if (
      kBytes.length >= prefix.length &&
      kBytes.subarray(0, prefix.length).every((b, i) => b === prefix[i])
    ) {
      // parse the leftover => hashed user ID in borsh
      const subKey = parseKeySuffix(kBytes, prefix.length);
      // parse the value => e.g. string, f32, TrustRequest
      const vBytes = Buffer.from(value, "base64");
      const val = parseValue(vBytes);
      result.set(subKey, val);
    }
  }
  return result;
}

/** 
 * 1) private_profile => <HashedUserId, string> 
 */
export function parsePrivateProfileSubMap(
  prefixBase64: string,
  contractState: ContractViewState
): Map<string, string> {
  return parseSubMap<string>(
    prefixBase64,
    contractState,
    parseStringValue
  );
}

/** 
 * 2) trust_network => <HashedUserId, f32> 
 */
export function parseTrustNetworkSubMap(
  prefixBase64: string,
  contractState: ContractViewState
): Map<string, number> {
  return parseSubMap<number>(
    prefixBase64,
    contractState,
    parseF32Value
  );
}

/** 
 * 3) trust_requests => <HashedUserId, TrustRequest> 
 */
export function parseTrustRequestsSubMap(
  prefixBase64: string,
  contractState: ContractViewState
): Map<string, TrustRequest> {
  return parseSubMap<TrustRequest>(
    prefixBase64,
    contractState,
    parseTrustRequestValue
  );
}

/** 
 * 4) blocked_requests => <HashedUserId, NearToken>
 */
export function parseBlockedRequestsSubMap(
  prefixBase64: string,
  contractState: ContractViewState
): Map<string, NearToken> {
  return parseSubMap<NearToken>(
    prefixBase64,
    contractState,
    parseNearTokenValue
  );
}

/**
 * 5) accepted_deposits => <HashedUserId, NearToken>
 */
export function parseAcceptedDepositsSubMap(
  prefixBase64: string,
  contractState: ContractViewState
): Map<string, NearToken> {
  return parseSubMap<NearToken>(
    prefixBase64,
    contractState,
    parseNearTokenValue
  );
}

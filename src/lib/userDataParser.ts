// src/lib/userDataParser.ts

import { deserialize, serialize } from "borsh";

/**
 * Basic classes for top-level fields in your contract's `UserData`.
 * The sub-maps (private_profile, trust_requests, etc.) are NOT fully stored
 * in a single chunk; they're actually out in separate storage keys.
 */

// ------------------------------------
// 1) Basic Rust-Like Classes
// ------------------------------------
export class HashedUserId {
  s_bs58!: string;
  constructor(fields: Partial<HashedUserId> = {}) {
    Object.assign(this, fields);
  }
}

export class NearToken {
  yocto!: string;
  constructor(fields: Partial<NearToken> = {}) {
    Object.assign(this, fields);
  }
}

/**
 * A minimal `UserData` with sub-maps left as "raw references" or empty
 * because default NEAR `IterableMap` is in separate prefixes.
 */
export class UserData {
  hashed_user_id!: HashedUserId;
  requested_trust_cost!: NearToken;
  public_profile!: string;

  // We might keep these as raw arrays or empty, but in default NEAR usage, 
  // they won't contain the real data. The real sub-map data is in separate keys.
  private_profile_raw!: Uint8Array;
  trust_network_raw!: Uint8Array;
  trust_requests_raw!: Uint8Array;
  blocked_requests_raw!: Uint8Array;
  accepted_deposits_raw!: Uint8Array;

  constructor(fields: Partial<UserData> = {}) {
    Object.assign(this, fields);
  }
}

/**
 * The JSON-based Borsh schema for the top-level fields.
 * We store sub-maps in raw arrays, but they're typically empty or partial references in default `IterableMap`.
 */
export const userDataSchema = {
  struct: {
    hashed_user_id: { struct: { s_bs58: "string" } },
    requested_trust_cost: { struct: { yocto: "string" } },
    public_profile: "string",
    private_profile_raw: { array: { type: "u8" } },
    trust_network_raw: { array: { type: "u8" } },
    trust_requests_raw: { array: { type: "u8" } },
    blocked_requests_raw: { array: { type: "u8" } },
    accepted_deposits_raw: { array: { type: "u8" } },
  },
};

/** 
 * Deserializes top-level `UserData`.
 * The sub-maps won't be fully stored in these raw fields if you're using default NEAR `IterableMap`.
 */
export function deserializeUserData(buffer: Uint8Array): UserData {
  const plain = deserialize(userDataSchema, buffer) as any;

  return new UserData({
    hashed_user_id: new HashedUserId({ s_bs58: plain.hashed_user_id.s_bs58 }),
    requested_trust_cost: new NearToken({ yocto: plain.requested_trust_cost.yocto }),
    public_profile: plain.public_profile,

    // Typically empty or partial references:
    private_profile_raw: Uint8Array.from(plain.private_profile_raw),
    trust_network_raw: Uint8Array.from(plain.trust_network_raw),
    trust_requests_raw: Uint8Array.from(plain.trust_requests_raw),
    blocked_requests_raw: Uint8Array.from(plain.blocked_requests_raw),
    accepted_deposits_raw: Uint8Array.from(plain.accepted_deposits_raw),
  });
}

/**
 * Serialize back if needed. 
 * Usually you won't do this on the front-end for default NEAR usage.
 */
export function serializeUserData(u: UserData): Uint8Array {
  const plainObj = {
    hashed_user_id: { s_bs58: u.hashed_user_id.s_bs58 },
    requested_trust_cost: { yocto: u.requested_trust_cost.yocto },
    public_profile: u.public_profile,

    private_profile_raw: Array.from(u.private_profile_raw),
    trust_network_raw: Array.from(u.trust_network_raw),
    trust_requests_raw: Array.from(u.trust_requests_raw),
    blocked_requests_raw: Array.from(u.blocked_requests_raw),
    accepted_deposits_raw: Array.from(u.accepted_deposits_raw),
  };
  return serialize(userDataSchema, plainObj);
}

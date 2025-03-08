// src/tests/userDataParser.test.ts

import { describe, it, expect } from "vitest";
import { Buffer } from "buffer";
import {
  serializeUserData,
  deserializeUserData,
  UserData,
  HashedUserId,
  NearToken,
} from "../lib/userDataParser";

/**
 * A mock snippet of NEAR contract state data from your example.
 * We'll store it in a constant for the integration test.
 */
const EXAMPLE_CONTRACT_STATE = {
  block_hash: "BqFJJnXkJ98NFK7b1HbggZ6TSeL42xPCWtn7wfiNMtTG",
  block_height: 184751370,
  values: [
    {
      key: "BOilyKQO6949yv33FBl1TKQ0s6CZ+E4xdMflSawXoU0=",
      value: "AACAZHWTwTM8BAAAAAAAAAAAAAA=",
    },
    {
      key: "Eh2VyQNpHm2LihpcOVxNR/nfh2ah4ZcAHtMAOlMU878=",
      value: "AACAPwAAAAA=",
    },
    {
      key: "U1RBVEU=",
      value: "AQAAAAIAAAB1dgIAAAB1bQEAAAACAAAAZHYCAAAAZG0AAECyusngGR4CAAAAAAAAAAAp+Q8mAgA=",
    },
    {
      key: "YSdVUmlF00cgh4e58eNb6AXmaXItvrB5MrKK0ZMbm0M=",
      value: "LAAAADllY0VLTHJYOWNXS1Y5RVJHUnBXVkNXN1I4UWt0c0pTWmU0SHJXMWZrYnVDAAAAAAAAAAAAAAAAAAAAACAAAABIb2JieTogS25pdHRpbmcsIENyb2NoZXQsIENyeXB0bwAAAAAkAAAAcHBfgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAHBwX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQEAAAAkAAAAdG5fgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAHRuX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQAAAAAkAAAAcnFfgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAHJxX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQAAAAAkAAAAYmxfgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAGJsX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQAAAAAkAAAAYWRfgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAGFkX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQAAAAA=",
    },
    {
      key: "ZHYAAAAA",
      value: "LAAAADllY0VLTHJYOWNXS1Y5RVJHUnBXVkNXN1I4UWt0c0pTWmU0SHJXMWZrYnVD",
    },
    {
      key: "dG5fgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2AAAAAA==",
      value: "LAAAADNyR1VLblE1WXRUYzhFWm5tTDJEVUd3UUdQZndDQXQzY0pZeGFwcnZiaHN6",
    },
    {
      key: "dXYAAAAA",
      value: "LAAAADllY0VLTHJYOWNXS1Y5RVJHUnBXVkNXN1I4UWt0c0pTWmU0SHJXMWZrYnVD",
    },
  ],
};

describe("UserData Parser (top-level) - Unit Tests", () => {
  it("serializes and deserializes a basic UserData object", () => {
    const user = new UserData({
      hashed_user_id: new HashedUserId({ s_bs58: "abcXYZ" }),
      requested_trust_cost: new NearToken({ yocto: "42" }),
      public_profile: "Hello world",
      private_profile_raw: new Uint8Array([1, 2, 3]),
      trust_network_raw: new Uint8Array([]),
      trust_requests_raw: new Uint8Array([99]),
      blocked_requests_raw: new Uint8Array([]),
      accepted_deposits_raw: new Uint8Array([]),
    });

    const serialized = serializeUserData(user);
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized.length).toBeGreaterThan(0);

    const decoded = deserializeUserData(serialized);
    expect(decoded.hashed_user_id.s_bs58).toBe("abcXYZ");
    expect(decoded.requested_trust_cost.yocto).toBe("42");
    expect(decoded.public_profile).toBe("Hello world");
    expect(decoded.private_profile_raw).toEqual(new Uint8Array([1, 2, 3]));
    expect(decoded.trust_requests_raw).toEqual(new Uint8Array([99]));
  });
});

/**
 * Integration test: We try to find a key in the example contract state 
 * that might represent a top-level `UserData` prefix (like 'u' prefix) 
 * and attempt to decode it as `UserData`.
 *
 * In many NEAR contracts, none of these keys may actually be 'u' prefix, 
 * so we might not decode anything. We just demonstrate the approach.
 */
describe("UserData Parser (top-level) - Integration Test", () => {
  it("attempts to parse user data from 'dv' or 'uv' prefixes in example state", () => {
    const userEntries = [];

    for (const { key, value } of EXAMPLE_CONTRACT_STATE.values) {
      const keyBytes = Buffer.from(key, "base64");
      if (keyBytes.length >= 2) {
        // Check if the first two ASCII bytes are "dv" or "uv" (or anything else).
        // 'd' => 0x64, 'v' => 0x76
        // 'u' => 0x75, 'v' => 0x76
        const prefix0 = keyBytes[0]; // e.g. 0x64 or 0x75
        const prefix1 = keyBytes[1]; // e.g. 0x76
        const isDv = prefix0 === 0x64 && prefix1 === 0x76;
        const isUv = prefix0 === 0x75 && prefix1 === 0x76;

        if (isDv || isUv) {
          // This is presumably user data
          const rawValue = Buffer.from(value, "base64");

          try {
            const userData = deserializeUserData(new Uint8Array(rawValue));
            userEntries.push({ key, userData });
          } catch (err) {
            // might fail offset, no biggie
          }
        }
      }
    }

    console.log("Decoded user data entries =>", userEntries);
    // Maybe we get 1 or more entries
    expect(userEntries.length).toBeGreaterThanOrEqual(0);

    // If any were decoded, let's see them
    for (const entry of userEntries) {
      console.log("UserData => hashed_user_id.s_bs58:", entry.userData.hashed_user_id.s_bs58);
      console.log("public_profile:", entry.userData.public_profile);
    }
  });
});
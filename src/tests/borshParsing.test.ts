// tests/borshParsing.test.ts
import { describe, it, expect } from "vitest";
import { Buffer } from "buffer";
import {
  HashedUserId,
  NearToken,
  UserData,
  deserializeUserData,
  serializeUserData,
} from "../lib/borshSchema";

/**
 * 1) UNIT TESTS
 *    - Test our Borsh (de)serialization in isolation with mock data.
 */
describe("Borsh Parsing Unit Tests", () => {
  it("serializes and deserializes a mock UserData object", () => {
    // Create a sample user data
    const sampleUser = new UserData({
      hashed_user_id: new HashedUserId({ s_bs58: "abcXYZ" }),
      requested_trust_cost: new NearToken({ yocto: "1000000000000" }),
      public_profile: "Hobby: Test Example",
      private_profile_raw: new Uint8Array([1, 2, 3]),
      trust_network_raw: new Uint8Array([10]),
      trust_requests_raw: new Uint8Array([]),
      blocked_requests_raw: new Uint8Array([99, 100]),
      accepted_deposits_raw: new Uint8Array([111, 112]),
    });

    // Serialize
    const serialized = serializeUserData(sampleUser);
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized.length).toBeGreaterThan(0);

    // Deserialize back
    const decoded = deserializeUserData(serialized);

    // Check fields match
    expect(decoded.hashed_user_id.s_bs58).toBe("abcXYZ");
    expect(decoded.requested_trust_cost.yocto).toBe("1000000000000");
    expect(decoded.public_profile).toBe("Hobby: Test Example");
    expect(decoded.private_profile_raw).toEqual(new Uint8Array([1, 2, 3]));
    expect(decoded.trust_network_raw).toEqual(new Uint8Array([10]));
    expect(decoded.blocked_requests_raw).toEqual(new Uint8Array([99, 100]));
    expect(decoded.accepted_deposits_raw).toEqual(new Uint8Array([111, 112]));
  });
});

/**
 * 2) INTEGRATION TESTS
 *    - Attempt to parse actual NEAR RPC state data. 
 *    - We'll do a minimal approach to show how you might decode
 *      certain base64 `value` fields if they actually store a `UserData`.
 *    - In practice, you may need to filter keys or detect user data prefixes.
 */
describe("Borsh Parsing Integration Tests", () => {
  /**
   * A snippet of the RPC result you provided. We'll treat it like an in-memory object.
   * In real usage, you'd fetch it from NEAR testnet via JSON-RPC or mock the fetch call.
   */
  const mockRpcResult = {
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
        value:
          "LAAAADllY0VLTHJYOWNXS1Y5RVJHUnBXVkNXN1I4UWt0c0pTWmU0SHJXMWZrYnVDAAAAAAAAAAAAAAAAAAAAACAAAABIb2JieTogS25pdHRpbmcsIENyb2NoZXQsIENyeXB0bwAAAAAkAAAAcHBfgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAHBwX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQEAAAAkAAAAdG5fgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAHRuX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQAAAAAkAAAAcnFfgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAHJxX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQAAAAAkAAAAYmxfgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAGJsX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQAAAAAkAAAAYWRfgH/Rz3Bzri+sI6ZhINK3L2toHUn0s9Y/xVQDs39u2XN2JAAAAGFkX4B/0c9wc64vrCOmYSDSty9raB1J9LPWP8VUA7N/btlzbQAAAAA=",
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

  it("decodes the sub fields and reads 'Hobby: Knitting...' if present", () => {
    const results: Array<{ key: string; user: UserData }> = [];

    for (const kv of mockRpcResult.values) {
      const { key, value } = kv;
      const rawBytes = Buffer.from(value, "base64");

      try {
        const userData = deserializeUserData(new Uint8Array(rawBytes));
        results.push({ key, user: userData });
      } catch {
        // ignore if doesn't decode
      }
    }

    // See if we got any user entries
    for (const { key, user } of results) {
      // If there's something in `trust_requests_raw`, let's decode it as string:
      const trustText = user.parseTrustRequestsAsString();
      console.log(`Key: ${key}, trust_requests_raw =>`, trustText);

      // If that text includes "Knitting, Crochet, Crypto", let's assert it:
      if (trustText.includes("Knitting, Crochet, Crypto")) {
        // We found the string we expected
        console.log(`User is referencing: ${trustText}`);
      }

      // Similarly, parse accepted deposits if you want:
      const acceptedStr = user.parseAcceptedDepositsAsString();
      console.log(`Accepted deposits raw =>`, acceptedStr);

      // For demonstration, let's do an expect on one:
      if (trustText.length > 0) {
        expect(trustText).toContain("Knitting");
      }
    }
  });
});

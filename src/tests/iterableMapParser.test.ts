// src/tests/iterableMapParser.test.ts
import { describe, it, expect } from "vitest";
import { parsePrivateProfileSubMap, parseTrustNetworkSubMap, ContractViewState } from "../lib/iterableMapParser";
import { Buffer } from "buffer";

describe("IterableMap Parser - Unit Tests", () => {
  it("parses a sample private_profile sub-map from mock view_state data", () => {
    // Suppose our prefix is "pp_something" => base64:
    const prefixBase64 = Buffer.from("pp_something").toString("base64"); 
    // e.g. "cHBfc29tZXRoaW5n"

    // We'll create mock results:
    const mockRpcResult = {
        "block_hash": "BqFJJnXkJ98NFK7b1HbggZ6TSeL42xPCWtn7wfiNMtTG",
        "block_height": 184751370,
      values: [
        {
          key: Buffer.from("pp_something\x00\x00\x00\x04test", "utf8").toString("base64"),
          value: Buffer.from("\x04\x00\x00\x00abcd", "binary").toString("base64"),
        },
        {
          // key => doesn't match prefix
          key: Buffer.from("xx_something", "utf8").toString("base64"),
          value: "AQAAAA==",
        },
      ]
    };

    const map = parsePrivateProfileSubMap(prefixBase64, mockRpcResult);
    // We see if it decoded 1 entry
    expect(map.size).toBe(1);

    // The key suffix => 'test' => we interpret that as s_bs58
    const val = map.get("test");
    expect(val).toBe("abcd");
  });
});


describe("parseTrustNetworkSubMap - Unit Test", () => {
    it("decodes trust_network entries from mock keys", () => {
      // Suppose prefix is "tn_someHashed" => base64
      const prefixBase64 = Buffer.from("tn_someHashed", "utf8").toString("base64"); 
      // e.g. "dG5fc29tZUhhc2hlZA=="
  
      // We'll build a key that matches that prefix, then a leftover sub-key = 
      //   Borsh string => length=3 => "bob"
      // value = f32 => let's say 0.5
      // Borsh layout for f32 => 4 bytes of little-endian float
      const floatArray = new Float32Array([0.5]);
      const rawF32 = new Uint8Array(floatArray.buffer);
  
      const leftoverKey = new Uint8Array([0x03, 0, 0, 0, ...Buffer.from("bob")]);
      const fullKey = Buffer.concat([
        Buffer.from("tn_someHashed", "utf8"), // the prefix
        leftoverKey
      ]);
      const keyBase64 = fullKey.toString("base64");
      const valBase64 = Buffer.from(rawF32).toString("base64");
  
      const mockState: ContractViewState = {
        block_hash: "abc",
        block_height: 123,
        values: [
          { key: keyBase64, value: valBase64 },
          { key: "xx", value: "yy" }, // not matching prefix
        ]
      };
  
      const map = parseTrustNetworkSubMap(prefixBase64, mockState);
      expect(map.size).toBe(1);
  
      // The sub-key is "bob" => we get 0.5
      const level = map.get("bob");
      expect(level).toBeCloseTo(0.5);
    });
  });
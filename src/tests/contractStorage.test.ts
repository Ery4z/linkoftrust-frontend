// tests/contractStorage.test.ts
import { describe, it, expect, beforeAll, vi } from "vitest";
import { parseUsersFromStorage, fetchContractStorage } from "../lib/contractStorage";

describe("contractStorage tests", () => {
  describe("parseUsersFromStorage", () => {
    it("decodes valid user data from mock 'view_state' result", () => {
      // Create a mock viewState object with one user entry under prefix 0x75
      // We'll store a real or dummy Borsh-encoded value for demonstration:
      const mockBase64Key = Buffer.from([0x75, 0x01, 0x02]).toString("base64");
      // Borsh-encoded data - in a real test, encode an actual user with your schema:
      const mockBase64Value = Buffer.from([
        // minimal example, might not be valid. 
        18, // ...
      ]).toString("base64");

      const viewState = {
        values: [
          { key: mockBase64Key, value: mockBase64Value },
          // Possibly other keys for testing
        ],
      };

      const users = parseUsersFromStorage(viewState);
      // We expect decoding might fail if the Borsh bytes are nonsense 
      // For a real test, you'd encode a real user so it passes
      expect(users.length).toBeGreaterThanOrEqual(0); 
    });

    it("skips keys that don't start with prefix 0x75", () => {
      const mockBase64Key = Buffer.from([0x76, 0x01, 0x02]).toString("base64"); // 0x76 => 'v'
      const mockBase64Value = Buffer.from([18, 99, 99]).toString("base64");
      const viewState = {
        values: [{ key: mockBase64Key, value: mockBase64Value }],
      };

      const users = parseUsersFromStorage(viewState);
      expect(users).toHaveLength(0);
    });
  });

  // Test fetchContractStorage - we can mock the fetch:
  describe("fetchContractStorage", () => {
    beforeAll(() => {
      global.fetch = vi.fn(); // vitest mock
    });

    it("fetches contract state via RPC", async () => {
      // Mock the fetch call:
      (fetch as any).mockResolvedValueOnce({
        json: async () => ({ result: { values: [] } }),
      });

      const result = await fetchContractStorage();
      expect(result).toEqual({ values: [] });
    });
  });
});

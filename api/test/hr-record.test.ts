import assert from "node:assert/strict";
import test from "node:test";
import { confidentialEmployeeFields } from "../src/lib/hr-record.js";

const profile = {
  nationality: "Nigerian",
  nin: { encrypted: "v1.secret-nin", last4: "1234" },
  bvn: { encrypted: "v1.secret-bvn", last4: "5678" },
  accountNumber: { encrypted: "v1.secret-account", last4: "9012" },
};

test("directory readers receive no confidential HR profile", () => {
  assert.deepEqual(confidentialEmployeeFields(profile, false), {});
});

test("HR record managers receive masked identifiers without ciphertext", () => {
  const result = confidentialEmployeeFields(profile, true);
  assert.deepEqual(result, {
    hrProfile: {
      nationality: "Nigerian",
      nin: { last4: "1234", masked: "••••1234" },
      bvn: { last4: "5678", masked: "••••5678" },
      accountNumber: { last4: "9012", masked: "••••9012" },
    },
  });
  assert.equal(JSON.stringify(result).includes("encrypted"), false);
  assert.equal(JSON.stringify(result).includes("v1.secret"), false);
});

import { describe, it, expect } from "vitest";
import { signRequest } from "../sigv4";
import type { PAAPIConfig } from "../types";

const testConfig: PAAPIConfig = {
  accessKey: "AKIAIOSFODNN7EXAMPLE",
  secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  partnerTag: "test-tag-20",
  host: "webservices.amazon.com",
  region: "us-east-1",
  marketplace: "www.amazon.com",
};

const fixedTimestamp = new Date("2024-01-15T12:00:00.000Z");
const testPayload = JSON.stringify({ Keywords: "headphones", ItemCount: 10 });

describe("F3.2 — AWS SigV4 Signing", () => {
  it("TC-3.2.1: signRequest returns object with headers property", () => {
    const result = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    expect(result).toHaveProperty("headers");
    expect(typeof result.headers).toBe("object");
  });

  it('TC-3.2.2: headers include Content-Type "application/json; charset=utf-8"', () => {
    const { headers } = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    expect(headers["Content-Type"]).toBe("application/json; charset=utf-8");
  });

  it('TC-3.2.3: headers include Content-Encoding "amz-1.0"', () => {
    const { headers } = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    expect(headers["Content-Encoding"]).toBe("amz-1.0");
  });

  it("TC-3.2.4: headers include Host matching config.host", () => {
    const { headers } = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    expect(headers["Host"]).toBe("webservices.amazon.com");
  });

  it("TC-3.2.5: X-Amz-Date is in correct format (YYYYMMDDTHHMMSSZ)", () => {
    const { headers } = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    expect(headers["X-Amz-Date"]).toMatch(/^\d{8}T\d{6}Z$/);
    expect(headers["X-Amz-Date"]).toBe("20240115T120000Z");
  });

  it("TC-3.2.6: X-Amz-Target contains correct operation prefix", () => {
    const { headers } = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    expect(headers["X-Amz-Target"]).toBe(
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
    );

    const { headers: headers2 } = signRequest("GetItems", testPayload, testConfig, fixedTimestamp);
    expect(headers2["X-Amz-Target"]).toBe(
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
    );
  });

  it('TC-3.2.7: Authorization header starts with "AWS4-HMAC-SHA256 Credential="', () => {
    const { headers } = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    expect(headers["Authorization"]).toMatch(/^AWS4-HMAC-SHA256 Credential=/);
  });

  it("TC-3.2.8: Authorization contains correct credential scope", () => {
    const { headers } = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    const auth = headers["Authorization"];
    // dateStamp/region/service/aws4_request
    expect(auth).toContain("20240115/us-east-1/ProductAdvertisingAPI/aws4_request");
    expect(auth).toContain("Credential=AKIAIOSFODNN7EXAMPLE/");
    expect(auth).toContain("SignedHeaders=");
    expect(auth).toContain("Signature=");
  });

  it("TC-3.2.9: same inputs + same timestamp produce identical signature", () => {
    const result1 = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    const result2 = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    expect(result1.headers["Authorization"]).toBe(result2.headers["Authorization"]);
  });

  it("TC-3.2.10: different payloads produce different signatures", () => {
    const result1 = signRequest("SearchItems", testPayload, testConfig, fixedTimestamp);
    const result2 = signRequest(
      "SearchItems",
      JSON.stringify({ Keywords: "laptop" }),
      testConfig,
      fixedTimestamp,
    );
    expect(result1.headers["Authorization"]).not.toBe(result2.headers["Authorization"]);
  });
});

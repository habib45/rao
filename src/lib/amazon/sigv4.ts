import { createHmac, createHash } from "node:crypto";
import type { PAAPIConfig, PAAPIOperation } from "./types";

export function signRequest(
  operation: PAAPIOperation,
  payload: string,
  config: PAAPIConfig,
  timestamp?: Date,
): { headers: Record<string, string> } {
  const now = timestamp ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "ProductAdvertisingAPI";
  const path = `/paapi5/${operation.toLowerCase()}`;

  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const payloadHash = createHash("sha256").update(payload).digest("hex");

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${config.host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}\n`;

  const signedHeaders =
    "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    "POST",
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const signingKey = [config.region, service, "aws4_request"].reduce(
    (key: Buffer, msg: string) =>
      createHmac("sha256", key).update(msg).digest(),
    createHmac("sha256", `AWS4${config.secretKey}`)
      .update(dateStamp)
      .digest(),
  );

  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Encoding": "amz-1.0",
      "Host": config.host,
      "X-Amz-Date": amzDate,
      "X-Amz-Target": `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`,
      "Authorization": `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

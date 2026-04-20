import type { PAAPIConfig } from "./types";

export function loadConfig(): PAAPIConfig {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;

  if (!accessKey) {
    throw new Error("Missing required environment variable: AMAZON_ACCESS_KEY");
  }
  if (!secretKey) {
    throw new Error("Missing required environment variable: AMAZON_SECRET_KEY");
  }
  if (!partnerTag) {
    throw new Error("Missing required environment variable: AMAZON_PARTNER_TAG");
  }

  return {
    accessKey,
    secretKey,
    partnerTag,
    host: "webservices.amazon.com",
    region: "us-east-1",
    marketplace: "www.amazon.com",
  };
}

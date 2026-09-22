// Test script — start the server, hit each health route, print results, exit.
// Usage:  node scripts/test-health.mjs
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = process.env.PORT || "3000";
const BASE = `http://127.0.0.1:${PORT}`;

const child = spawn(
  process.execPath,
  ["server.js"],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT,
      MYSQL_API_URL: "http://127.0.0.1:4000", // intentionally unreachable on this box
      MYSQL_API_SECRET: "dev-only-mysql-api-secret",
      MYSQL_API_JWT_TOKEN: "dev-only-mysql-api-jwt",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let booted = false;
child.stdout.on("data", (d) => {
  const s = d.toString();
  process.stdout.write(`[server] ${s}`);
  if (s.includes("Ready on")) booted = true;
});
child.stderr.on("data", (d) => process.stderr.write(`[server:err] ${d}`));

// Wait up to 15s for "Ready on"
for (let i = 0; i < 30 && !booted; i++) await sleep(500);
if (!booted) {
  console.error("Server did not boot in 15s");
  child.kill();
  process.exit(1);
}

async function hit(path) {
  try {
    const res = await fetch(BASE + path, {
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    console.log(`\n=== GET ${path} ===`);
    console.log(`HTTP ${res.status}`);
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log(text.slice(0, 500));
    }
  } catch (e) {
    console.log(`\n=== GET ${path} ===`);
    console.log(`FETCH ERROR: ${e.message}`);
  }
}

await hit("/api/health");
await hit("/api/health/db");
await hit("/api/health/auth");
await hit("/api/health/auth?mode=missing-credentials");

console.log("\n[test] done");
child.kill();
await sleep(200);
process.exit(0);
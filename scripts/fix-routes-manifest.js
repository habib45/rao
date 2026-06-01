const fs = require("fs");
const path = require("path");

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

try {
  const manifestPath = path.join(__dirname, "..", ".next", "routes-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.warn("fix-routes-manifest: routes-manifest.json not found; skipping");
    process.exit(0);
  }

  const raw = fs.readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(raw);

  const keysToNormalize = [
    "dataRoutes",
    "appRoutes",
    "dynamicRoutes",
    "staticRoutes",
    "dynamicRoutesV2",
  ];

  let changed = false;

  for (const key of keysToNormalize) {
    const originalValue = manifest[key];
    const normalizedValue = ensureArray(originalValue);

    if (normalizedValue !== originalValue) {
      manifest[key] = normalizedValue;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    console.log("fix-routes-manifest: normalized route arrays");
  } else {
    console.log("fix-routes-manifest: manifest already normalized");
  }
} catch (error) {
  console.error("fix-routes-manifest: failed to normalize routes manifest", error);
  process.exit(1);
}

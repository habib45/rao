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

  const originalDataRoutes = manifest.dataRoutes;
  const originalAppRoutes = manifest.appRoutes;

  manifest.dataRoutes = ensureArray(manifest.dataRoutes);
  manifest.appRoutes = ensureArray(manifest.appRoutes);

  if (manifest.dataRoutes !== originalDataRoutes || manifest.appRoutes !== originalAppRoutes) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    console.log("fix-routes-manifest: normalized dataRoutes/appRoutes arrays");
  } else {
    console.log("fix-routes-manifest: manifest already normalized");
  }
} catch (error) {
  console.error("fix-routes-manifest: failed to normalize routes manifest", error);
  process.exit(1);
}

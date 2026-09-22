const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
// Bind to 0.0.0.0 so Namecheap / shared-hosting reverse proxies and
// external health-checks can reach us. Without this, the host's edge
// proxy can't connect and you see a 503 even though Next.js is up.
const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  }).listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> PORT environment variable: ${process.env.PORT}`);
  });
});

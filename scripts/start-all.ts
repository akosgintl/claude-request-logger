// Start the proxy and the viewer in one terminal: `npm run all`.
//
// Both run in this one process, so one Ctrl+C stops both. The proxy goes
// first, so its setup questions get the terminal to themselves; the viewer
// starts only once the proxy is listening.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { main as startProxy } from "../proxy/proxy";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  const listening = await startProxy();
  // No proxy (an agent that cannot be logged, say): it already explained
  // why, so stop here rather than start a viewer for nothing.
  if (!listening) process.exit(0);

  const viewer = await createServer({
    configFile: path.join(root, "viewer", "vite.config.ts"),
  });
  await viewer.listen();
  console.log("[viewer] Harness Inspector is running:");
  viewer.printUrls();
  console.log("");
} catch (err) {
  console.error(`[start-all] ${(err as Error).message}`);
  process.exit(1);
}

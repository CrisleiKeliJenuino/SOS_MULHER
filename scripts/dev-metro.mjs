import net from "node:net";
import { spawn } from "node:child_process";

const USE_SHELL = process.platform === "win32";

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(startPort = 8081) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function parsePort(value) {
  if (!value) return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

async function main() {
  const preferredPort = parsePort(process.env.EXPO_PORT) ?? 8081;
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Expo port ${preferredPort} is busy, using port ${port} instead`);
  }

  const env = {
    ...process.env,
    EXPO_USE_METRO_WORKSPACE_ROOT: process.env.EXPO_USE_METRO_WORKSPACE_ROOT ?? "1",
    EXPO_PORT: String(port),
  };

  const child = spawn(
    "pnpm",
    [
      "exec",
      "expo",
      "start",
      "--web",
      "--port",
      String(port),
      "--non-interactive",
    ],
    { stdio: "inherit", env, shell: USE_SHELL },
  );

  child.on("error", (error) => {
    console.error("[dev:metro] Failed to start Expo:", String(error));
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error(String(err?.stack ?? err));
  process.exit(1);
});

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

async function findAvailablePort(startPort, attempts = 20) {
  for (let port = startPort; port < startPort + attempts; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function parsePort(value) {
  if (!value) return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function killProcess(child) {
  if (!child || child.killed) return;
  try {
    child.kill("SIGTERM");
  } catch {
    // ignore
  }
}

async function main() {
  const preferredExpoPort = parsePort(process.env.EXPO_PORT) ?? 8081;
  const expoPort = await findAvailablePort(preferredExpoPort);

  if (expoPort !== preferredExpoPort) {
    console.log(`Expo port ${preferredExpoPort} is busy, using port ${expoPort} instead`);
  }

  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    EXPO_USE_METRO_WORKSPACE_ROOT: process.env.EXPO_USE_METRO_WORKSPACE_ROOT ?? "1",
    EXPO_PORT: String(expoPort),
    EXPO_WEB_PREVIEW_URL: `http://localhost:${expoPort}`,
  };

  const server = spawn("pnpm", ["dev:server"], { stdio: "inherit", env, shell: USE_SHELL });
  const metro = spawn(
    "pnpm",
    [
      "exec",
      "expo",
      "start",
      "--web",
      "--port",
      String(expoPort),
      "--non-interactive",
    ],
    { stdio: "inherit", env, shell: USE_SHELL },
  );

  const shutdown = (code) => {
    killProcess(server);
    killProcess(metro);
    process.exit(code);
  };

  server.on("exit", (code) => {
    shutdown(code ?? 1);
  });

  server.on("error", (error) => {
    console.error("[dev:server] Failed to start:", String(error));
    shutdown(1);
  });

  metro.on("exit", (code) => {
    shutdown(code ?? 1);
  });

  metro.on("error", (error) => {
    console.error("[dev:metro] Failed to start Expo:", String(error));
    shutdown(1);
  });

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
}

main().catch((err) => {
  console.error(String(err?.stack ?? err));
  process.exit(1);
});

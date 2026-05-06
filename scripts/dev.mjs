import net from "node:net";
import { spawn } from "node:child_process";

const IS_WIN = process.platform === "win32";

function spawnPnpm(args, options) {
  // On Windows, `pnpm` is typically a `.cmd` shim which can't be spawned directly
  // via CreateProcess (it can result in spawn EINVAL). Run it through cmd.exe
  // while keeping shell=false to avoid Node's DEP0190 warning.
  if (IS_WIN) {
    return spawn("cmd.exe", ["/d", "/s", "/c", "pnpm", ...args], {
      ...options,
      shell: false,
    });
  }

  return spawn("pnpm", args, { ...options, shell: false });
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    // Bind without a host to detect conflicts on any interface.
    server.listen(port, () => {
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

  const server = spawnPnpm(["dev:server"], { stdio: "inherit", env });
  const metro = spawnPnpm(
    [
      "exec",
      "expo",
      "start",
      "--web",
      "--port",
      String(expoPort),
    ],
    {
      stdio: "inherit",
      env,
    },
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

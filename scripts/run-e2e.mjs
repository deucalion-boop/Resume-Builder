import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import process from "node:process";

const isWindows = process.platform === "win32";
const childEnv = { ...process.env, E2E_ADMIN_SECRET: process.env.E2E_ADMIN_SECRET ?? randomUUID() };

await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", () => reject(new Error("Port 3000 is already in use. Stop the existing server before running E2E tests.")));
  probe.once("listening", () => probe.close(resolve));
  probe.listen(3000);
});

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start"], {
  cwd: process.cwd(),
  detached: !isWindows,
  env: childEnv,
  stdio: "inherit",
});

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Next.js exited with code ${server.exitCode}.`);
    try {
      const response = await fetch("http://127.0.0.1:3000");
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the production server.");
}

function stopServer() {
  if (isWindows) {
    if (server.pid) spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    const sockets = spawnSync("netstat", ["-ano"], { encoding: "utf8" }).stdout ?? "";
    const listener = sockets.match(/^\s*TCP\s+\S+:3000\s+\S+\s+LISTENING\s+(\d+)/m);
    if (listener?.[1]) spawnSync("taskkill", ["/PID", listener[1], "/T", "/F"], { stdio: "ignore" });
  } else {
    if (!server.pid || server.exitCode !== null) return;
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // It already exited.
    }
  }
}

function stopProcessTree(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (isWindows) spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else {
    try { process.kill(-child.pid, "SIGTERM"); } catch { /* It already exited. */ }
  }
}

let exitCode = 1;
try {
  await waitForServer();
  exitCode = await new Promise(resolve => {
    const tests = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], {
      cwd: process.cwd(),
      detached: !isWindows,
      env: { ...childEnv, E2E_EXTERNAL_SERVER: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let settled = false;
    let reportTimer;
    const finish = code => {
      if (settled) return;
      settled = true;
      if (reportTimer) clearTimeout(reportTimer);
      resolve(code);
    };
    const forward = (chunk, target) => {
      const text = chunk.toString();
      output += text;
      target.write(text);
      const cleanOutput = output.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
      if (/\d+\s+passed/.test(cleanOutput) && !reportTimer) {
        reportTimer = setTimeout(() => {
          const cleanReport = output.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
          const failed = /\d+\s+failed/.test(cleanReport);
          stopProcessTree(tests);
          finish(failed ? 1 : 0);
        }, 2_000);
      }
    };
    tests.stdout.on("data", chunk => forward(chunk, process.stdout));
    tests.stderr.on("data", chunk => forward(chunk, process.stderr));
    tests.once("exit", code => finish(code ?? 1));
    tests.once("error", () => finish(1));
  });
} finally {
  stopServer();
}

process.exitCode = exitCode;

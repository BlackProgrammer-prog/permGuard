#!/usr/bin/env node

import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const releaseDir = path.join(rootDir, ".release");
const packageNames = [
  "@ironpermjs/core",
  "@ironpermjs/server",
  "@ironpermjs/react",
  "@ironpermjs/next",
  "@ironpermjs/analyzer",
  "@ironpermjs/graph",
  "@ironpermjs/diff",
  "@ironpermjs/reporter",
  "@ironpermjs/cli",
];

function run(command, args, cwd) {
  const environment = { ...process.env };
  delete environment.npm_config_verify_deps_before_run;
  delete environment.npm_config__jsr_registry;

  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: environment,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `smoke: ${command} ${args.join(" ")} exited with ${result.status}.`,
    );
  }
}

const tarballs = readdirSync(releaseDir)
  .filter((entry) => entry.endsWith(".tgz"))
  .sort()
  .map((entry) => path.join(releaseDir, entry));

if (tarballs.length !== packageNames.length) {
  throw new Error(
    `smoke: expected ${packageNames.length} tarballs, found ${tarballs.length}.`,
  );
}

const temporaryPrefix = path.join(tmpdir(), "ironpermjs-smoke-");
const smokeDir = mkdtempSync(temporaryPrefix);
const resolvedSmokeDir = path.resolve(smokeDir);

if (!resolvedSmokeDir.startsWith(temporaryPrefix)) {
  throw new Error("smoke: refusing to use an unexpected directory.");
}

try {
  writeFileSync(
    path.join(smokeDir, "package.json"),
    `${JSON.stringify(
      {
        name: "ironpermjs-package-smoke",
        version: "0.0.0",
        private: true,
        type: "module",
      },
      null,
      2,
    )}\n`,
  );

  run(
    "npm",
    [
      "install",
      ...tarballs,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefer-offline",
    ],
    smokeDir,
  );

  run(
    process.execPath,
    [
      path.join(smokeDir, "node_modules/@ironpermjs/cli/dist/bin.js"),
      "--version",
    ],
    smokeDir,
  );

  const importScript = `
    const names = ${JSON.stringify(packageNames)};
    await Promise.all(names.map((name) => import(name)));
    process.stdout.write("Imported " + names.length + " packages from tarballs.\\n");
  `;
  run(
    process.execPath,
    ["--input-type=module", "--eval", importScript],
    smokeDir,
  );
} finally {
  rmSync(resolvedSmokeDir, { recursive: true, force: true });
}

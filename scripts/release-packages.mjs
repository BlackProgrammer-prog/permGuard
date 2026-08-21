#!/usr/bin/env node

import { mkdirSync, readFileSync, rmSync } from "node:fs";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";
import path from "node:path";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const releaseDir = path.join(rootDir, ".release");
const packageDirs = [
  "packages/core",
  "packages/server",
  "packages/react",
  "packages/next",
  "packages/analyzer",
  "packages/graph",
  "packages/diff",
  "packages/reporter",
  "packages/cli",
];
const action = process.argv[2] ?? "verify";
const supportedActions = new Set(["pack", "verify", "dry-run", "publish"]);

function fail(message) {
  throw new Error(`release: ${message}`);
}

function run(command, args, options = {}) {
  const environment = { ...process.env };
  if (command === "npm") {
    delete environment.npm_config_verify_deps_before_run;
    delete environment.npm_config__jsr_registry;
  }

  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    encoding: "utf8",
    env: environment,
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (options.capture && result.stderr) process.stderr.write(result.stderr);
    fail(`${command} ${args.join(" ")} exited with ${result.status}.`);
  }

  return result.stdout ?? "";
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)/u.exec(value.trim());
  if (!match) fail(`cannot parse version "${value.trim()}".`);
  return match.slice(1).map(Number);
}

function atLeast(actual, minimum) {
  for (let index = 0; index < minimum.length; index += 1) {
    if (actual[index] > minimum[index]) return true;
    if (actual[index] < minimum[index]) return false;
  }
  return true;
}

function packageManifest(packageDir) {
  return JSON.parse(
    readFileSync(path.join(rootDir, packageDir, "package.json"), "utf8"),
  );
}

function assertNoWorkspaceProtocol(value, field = "manifest") {
  if (typeof value === "string" && value.startsWith("workspace:")) {
    fail(`${field} still contains ${value} after packing.`);
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assertNoWorkspaceProtocol(child, `${field}.${key}`);
  }
}

function prepareReleaseDirectory() {
  const resolved = path.resolve(releaseDir);
  if (resolved !== path.join(path.resolve(rootDir), ".release")) {
    fail("refusing to clean an unexpected release directory.");
  }
  rmSync(resolved, { recursive: true, force: true });
  mkdirSync(resolved, { recursive: true });
}

function packPackages() {
  prepareReleaseDirectory();
  return packageDirs.map((packageDir) => {
    const stdout = run(
      "pnpm",
      [
        "--dir",
        path.join(rootDir, packageDir),
        "pack",
        "--pack-destination",
        releaseDir,
        "--json",
      ],
      { capture: true },
    );
    const jsonStart = stdout.indexOf("{");
    if (jsonStart < 0) fail(`pnpm pack returned no JSON for ${packageDir}.`);
    const packed = JSON.parse(stdout.slice(jsonStart));
    process.stdout.write(`Packed ${packed.name}@${packed.version}\n`);
    return {
      directory: packageDir,
      filename: packed.filename,
      name: packed.name,
      version: packed.version,
    };
  });
}

function verifyPackages(packedPackages) {
  const versions = new Set();
  for (const packed of packedPackages) {
    const entries = new Set(
      run("tar", ["-tzf", packed.filename], { capture: true })
        .split("\n")
        .filter(Boolean),
    );
    const requiredEntries = [
      "package/package.json",
      "package/README.md",
      "package/LICENSE",
      "package/dist/index.js",
      "package/dist/index.d.ts",
    ];
    if (packed.directory === "packages/cli") {
      requiredEntries.push("package/dist/bin.js");
    }
    for (const entry of requiredEntries) {
      if (!entries.has(entry)) fail(`${packed.name} is missing ${entry}.`);
    }

    const manifest = JSON.parse(
      run("tar", ["-xOzf", packed.filename, "package/package.json"], {
        capture: true,
      }),
    );
    assertNoWorkspaceProtocol(manifest);
    versions.add(manifest.version);

    if (manifest.private === true) fail(`${manifest.name} is private.`);
    if (manifest.license !== "MIT") fail(`${manifest.name} must use MIT.`);
    if (manifest.publishConfig?.access !== "public") {
      fail(`${manifest.name} must publish with public access.`);
    }
    if (manifest.publishConfig?.registry !== "https://registry.npmjs.org/") {
      fail(`${manifest.name} must target the public npm registry.`);
    }
    if (
      !manifest.repository?.url?.includes("BlackProgrammer-prog/IronPermJS")
    ) {
      fail(`${manifest.name} has an incorrect repository URL.`);
    }
    if (!manifest.engines?.node) {
      fail(`${manifest.name} does not declare a Node.js engine.`);
    }
    process.stdout.write(`Verified ${manifest.name}@${manifest.version}\n`);
  }

  if (versions.size !== 1) {
    fail("all packages must use the same release version.");
  }
  return [...versions][0];
}

function assertPublishEnvironment(version) {
  const npmVersion = parseVersion(run("npm", ["--version"], { capture: true }));
  const nodeVersion = parseVersion(process.versions.node);
  if (!atLeast(nodeVersion, [22, 14, 0])) {
    fail("trusted publishing requires Node.js 22.14.0 or newer.");
  }
  if (!atLeast(npmVersion, [11, 5, 1])) {
    fail("trusted publishing requires npm 11.5.1 or newer.");
  }
  if (process.env.IRONPERMJS_PUBLISH !== "1") {
    fail("set IRONPERMJS_PUBLISH=1 to confirm a real registry publish.");
  }

  const expectedScope = process.env.IRONPERMJS_NPM_SCOPE;
  if (!expectedScope?.startsWith("@")) {
    fail("set IRONPERMJS_NPM_SCOPE to the npm scope you own.");
  }
  for (const packageDir of packageDirs) {
    const manifest = packageManifest(packageDir);
    if (!manifest.name.startsWith(`${expectedScope}/`)) {
      fail(
        `${manifest.name} does not belong to IRONPERMJS_NPM_SCOPE=${expectedScope}.`,
      );
    }
  }

  if (process.env.GITHUB_REF_TYPE === "tag") {
    const tag = process.env.GITHUB_REF_NAME;
    if (tag !== `v${version}`) {
      fail(`tag ${tag} must match package version v${version}.`);
    }
  }

  const trackedChanges = run(
    "git",
    ["status", "--porcelain", "--untracked-files=no"],
    { capture: true },
  ).trim();
  if (trackedChanges) fail("tracked files are modified; commit them first.");
}

if (!supportedActions.has(action)) {
  fail(`unknown action "${action}". Use pack, verify, dry-run, or publish.`);
}

const packedPackages = packPackages();
const version = verifyPackages(packedPackages);

if (action === "dry-run") {
  for (const packed of packedPackages) {
    run("npm", ["publish", packed.filename, "--access", "public", "--dry-run"]);
  }
}

if (action === "publish") {
  assertPublishEnvironment(version);
  for (const packed of packedPackages) {
    run("npm", ["publish", packed.filename, "--access", "public"]);
  }
}

process.stdout.write(
  action === "publish"
    ? `Published IronPermJS v${version}.\n`
    : `Release artifacts are ready in ${releaseDir}.\n`,
);

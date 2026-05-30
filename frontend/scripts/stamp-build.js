#!/usr/bin/env node
// Stamps the current git short hash into .next/build-stamp.txt
// so PM2's pre-start check can verify the build matches HEAD.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const stampFile = path.join(__dirname, "..", ".next", "build-stamp.txt");

try {
  const hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  fs.writeFileSync(stampFile, hash + "\n");
  console.log(`[stamp-build] Stamped ${hash} → .next/build-stamp.txt`);
} catch {
  console.log("[stamp-build] WARN: Not in a git repo, skipping stamp.");
}

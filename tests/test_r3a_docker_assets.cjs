"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const docker = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");
const landing = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "dashboard.html"), "utf8");
const assets = ["handoff-ui.js", "diagnosis-ui.js", "dashboard.js", "dashboard.css"];
assert.ok(landing.includes('src="/diagnosis-ui.js"'), "Landing must load R3-A JS");
assert.ok(dashboard.includes('src="dashboard.js"'), "Dashboard must load JS");
for (const asset of assets) {
  assert.ok(fs.existsSync(path.join(root, asset)), "Missing source asset: "+asset);
  const expected = `COPY ${asset} /usr/share/nginx/html/${asset}`;
  assert.ok(docker.split(/\r?\n/).some(line => line.trim() === expected),
    "Missing Docker COPY: "+asset);
}
console.log("PASS: R3-A and dashboard assets are included in production Nginx Docker image.");

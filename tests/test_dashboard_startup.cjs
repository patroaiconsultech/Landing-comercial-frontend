"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const JS = fs.readFileSync(path.join(__dirname, "..", "dashboard.js"), "utf8");

async function checkStartup(response, expectedMessage, expectedClass) {
  const nodes = new Map();
  const element = () => ({
    textContent: "", className: "", value: "",
    classList: {toggle() {}},
    addEventListener() {},
    focus() {},
    replaceChildren() {},
    append() {},
  });
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, element());
      return nodes.get(id);
    },
  };
  const fetch = async () => response;
  vm.runInNewContext(JS, { document, fetch, URLSearchParams, Option: class {} });
  // Allow the async session lookup and error handling to settle.
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(nodes.get("notice").textContent, expectedMessage);
  assert.equal(nodes.get("notice").className, expectedClass);
  assert.equal(nodes.get("who").textContent, "Sessão não iniciada");
}

(async () => {
  const reply = (status, detail) => ({
    status, ok: false, json: async () => ({detail}),
  });
  await checkStartup(reply(401, "UNAUTHENTICATED"),
    "Entre com sua conta administrativa.", "notice");
  await checkStartup(reply(503, "ADMIN_UNAVAILABLE"),
    "Painel administrativo ainda não habilitado.", "notice error");
  await checkStartup(reply(404, "Not Found"),
    "API administrativa não encontrada (404).", "notice error");
  await checkStartup(reply(502, undefined),
    "Não foi possível conectar ao backend administrativo.", "notice error");
  console.log("PASS: dashboard startup comunica corretamente 401/404/502/503.");
})().catch((error) => { console.error(error); process.exitCode = 1; });

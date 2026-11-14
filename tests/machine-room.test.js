import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../site/machine-room/index.html", import.meta.url), "utf8");

test("Machine Room DOM IDs are unique and every script reference exists", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
  const refs = [...html.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]);
  for (const id of refs) assert.ok(ids.includes(id), `Missing DOM ID: ${id}`);
});

test("inline application JavaScript parses successfully", () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length >= 1, "Inline app script must exist");
  try { new vm.Script(scripts.at(-1)[1], { filename: "machine-room-inline.js" }); } catch (error) { throw new Error(error.stack); }
});

test("live mode uses Pollinations and the official BYOP Connect widget", () => {
  assert.match(html, /https:\/\/gen\.pollinations\.ai\/v1\/chat\/completions/);
  assert.match(html, /@pollinations\/ui@0\.1\.0-alpha\.20\/dist\/connect\.js/);
  assert.match(html, /createElement\("polli-connect"\)/);
  assert.match(html, /badge-made-with\.svg/);
});

test("offline demo, interrupt control, and virtual-only warning are present", () => {
  assert.match(html, /Boot the free demo/);
  assert.match(html, /id="stopBtn"/);
  assert.match(html, /AbortController/);
  assert.match(html, /SIMULATION ONLY · NO HOST COMMANDS EXECUTED/);
  assert.match(html, /No API calls will be made and no Pollen is spent/);
});

test("model output is presented as simulated text and responsive mobile layout exists", () => {
  assert.match(html, /textContent/);
  assert.match(html, /@media\(max-width:620px\)/);
  assert.match(html, /aria-live="polite"/);
});

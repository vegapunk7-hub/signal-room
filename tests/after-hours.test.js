import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../site/after-hours/index.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../site/after-hours/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../site/after-hours/styles.css", import.meta.url), "utf8");

test("every DOM ID referenced by After Hours exists in its page", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML ids must be unique");
  const referenced = [...js.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]);
  for (const id of referenced) assert.ok(ids.includes(id), `Missing HTML id: ${id}`);
});

test("live turns use Pollinations chat completions and official BYOP Connect", () => {
  assert.match(js, /https:\/\/gen\.pollinations\.ai\/v1\/chat\/completions/);
  assert.match(js, /https:\/\/gen\.pollinations\.ai\/v1\/models/);
  assert.match(html, /@pollinations\/ui@0\.1\.0-alpha\.20\/dist\/connect\.js/);
  assert.match(js, /createElement\("polli-connect"\)/);
  assert.match(html, /badge-made-with\.svg/);
});

test("sessions have bounded turn counts, a stop control, and a free demo", () => {
  for (const count of [4, 6, 8]) assert.match(html, new RegExp(`value="${count}"`));
  assert.match(html, /id="stopBtn"/);
  assert.match(js, /AbortController/);
  assert.match(js, /0 API calls · no Pollen spent/);
});

test("model-generated journal text is escaped instead of executed as markup", () => {
  assert.match(js, /function safe\(/);
  assert.match(js, /safe\(turn\.text\)/);
  assert.match(js, /JSON\.parse\(text\)/);
  assert.doesNotMatch(js, /eval\s*\(|new Function\s*\(/);
});

test("mobile layout and dialog accessibility are present", () => {
  assert.match(css, /@media\(max-width:620px\)/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="dialog" aria-modal="true"/);
});

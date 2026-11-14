import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../site/styles.css", import.meta.url), "utf8");

test("every JavaScript DOM id reference exists in the page", () => {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, "HTML ids must be unique");
    const referenced = [...js.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]);
    for (const id of referenced) assert.ok(ids.includes(id), `Missing HTML id: ${id}`);
});

test("app uses Pollinations chat completions and official BYOP widget", () => {
    assert.match(js, /https:\/\/gen\.pollinations\.ai\/v1\/chat\/completions/);
    assert.match(html, /@pollinations\/ui@0\.1\.0-alpha\.20\/dist\/connect\.js/);
    assert.match(js, /createElement\("polli-connect"\)/);
});

test("no-cost demo and safety controls are present", () => {
    assert.match(html, /Explore a no-cost demo/);
    assert.match(html, /Stop investigation/);
    assert.match(js, /function loadDemo\(\)/);
    assert.match(js, /function exportTranscript\(\)/);
});

test("layout includes a mobile breakpoint", () => {
    assert.match(css, /@media\(max-width:760px\)/);
});

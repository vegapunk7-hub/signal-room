const API = "https://gen.pollinations.ai/v1/chat/completions";
const MODELS_API = "https://gen.pollinations.ai/v1/models";
const ENTER = "https://enter.pollinations.ai";
// Optional: your own App Key (pk_...) from enter.pollinations.ai/keys, with this
// page's URL as a redirect URI. It names the app on the sign-in screen and lets
// you turn on developer earnings. Sign-in works without it.
const APP_KEY = "";
const KEY_STORE = "signal-room-key";
const FALLBACK_MODELS = [
  "openai/gpt-5.4-nano",
  "deepseek/deepseek-v4-flash",
  "google/gemini-3.7-flash",
  "anthropic/claude-sonnet-4.6",
];
const CASES = {
  lighthouse: "A lighthouse has transmitted the same coordinates every night for 80 years. The coordinates point to open ocean, but tonight a new signal arrived: WE ARE HOME. The lighthouse has no power source and its keeper disappeared in 1946.",
  garden: "A research garden has begun growing backwards. Fruit returns to flowers, fallen leaves climb into branches, and the oldest tree has started producing seeds dated 400 years in the future. The effect happens only after midnight.",
  station: "An unmanned research station on Europa has sent four status messages. The first three are normal. The fourth says: CREW COUNT: 6. The station was built for two people, and its cameras show five empty chairs around a warm table.",
};
const DEMO = [
  { who: "ARIA", role: "FIELD ANALYST", model: "OFFLINE CASE FILE", text: "The new message changes the problem. The old coordinates could be a beacon, a memorial, or a timing reference—but 'we are home' implies the sender believes the lighthouse is a destination.\n\nI would separate the signal into two parts: the repeated location and the new sentence. The location has been stable for decades; the sentence is the anomaly. We should not assume the sender is physically at those coordinates.", latency: "DEMO" },
  { who: "VEGA", role: "SYSTEMS THINKER", model: "OFFLINE CASE FILE", text: "Agreed, but there is another possibility: the coordinates may describe where the signal began, not where it is received. A lighthouse is a timing instrument as much as a navigation aid.\n\nThe 1946 disappearance matters. If the keeper vanished when the transmission started, the signal could be an automated loop. Tonight's sentence suggests the loop has changed—or someone has learned how to answer it.\n\nMy proposed test: record the signal's exact arrival time for seven nights and compare it with local tide and astronomical cycles. If it tracks neither, we need to investigate the transmitter itself.", latency: "DEMO" },
  { who: "ARIA", role: "FIELD ANALYST", model: "OFFLINE CASE FILE", text: "That gives us two live hypotheses: a navigation beacon being answered, or a transmitter that has begun generating new content. I found one detail we should not ignore: the same coordinates every night for 80 years is unlikely to be a random distress call.\n\nLet's treat the new sentence as a reply, not a confession. We need a question the sender can answer without revealing more than necessary: 'What is the first thing you can see?' A stable answer would help us distinguish a fixed location from a moving observer.", latency: "DEMO" },
  { who: "VEGA", role: "SYSTEMS THINKER", model: "OFFLINE CASE FILE", text: "I would add a safety condition: do not send a person to the coordinates until we know whether the signal is synchronized with the lighthouse or merely routed through it.\n\nOur strongest working theory is a two-way system that has only now produced a human-readable response. Confidence is low-to-medium; the physical source is unknown. Next evidence: direction of arrival, waveform changes, and whether the reply changes when the lighthouse lamp is covered.\n\nThe mystery is not solved yet, but we have a testable plan rather than a story we invented around one sentence.", latency: "DEMO" },
];
const $ = (id) => document.getElementById(id);
const state = { apiKey: sessionStorage.getItem(KEY_STORE), running: false, controller: null, turns: [], totalMs: 0, startedAt: 0, caseNumber: 0, toastTimer: null, selectedModels: new Set(FALLBACK_MODELS) };

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
function safeText(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function setRoom(status, label) {
  const el = $("roomState");
  el.className = `room-state ${status}`;
  el.innerHTML = `<i></i> ${safeText(label)}`;
  document.querySelector(".signal-wave").classList.toggle("active", status === "running");
}
function setProgress(done, total, label) {
  $("progressText").textContent = label;
  $("progressCount").textContent = `${done} / ${total}`;
  $("progressBar").style.width = `${total ? Math.min(100, done / total * 100) : 0}%`;
}
function setBusy(busy) {
  state.running = busy;
  $("startBtn").disabled = busy;
  $("stopBtn").disabled = !busy;
  $("demoBtn").disabled = busy;
  $("rounds").disabled = busy;
  $("mission").disabled = busy;
  $("modelA").disabled = busy;
  $("modelB").disabled = busy;
}
function setSignal(title, subtitle) {
  $("signalTitle").textContent = title.toUpperCase();
  $("signalSubtitle").textContent = subtitle;
}
function scrollTranscript() {
  const el = $("transcript");
  el.scrollTop = el.scrollHeight;
}
function resetTranscript() {
  $("transcript").innerHTML = "";
  $("exportBtn").disabled = true;
  state.turns = [];
  state.totalMs = 0;
  $("usageText").textContent = "No API calls yet";
  $("latencyText").textContent = "—";
}
function appendTurnCard(who, role, model, initial = "", meta = "LIVE") {
  $("emptyState")?.remove();
  const key = who === "ARIA" ? "agent-a" : "agent-b";
  const letter = who === "ARIA" ? "A" : "V";
  const card = document.createElement("article");
  card.className = `turn-card ${key}`;
  card.innerHTML = `<div class="turn-head"><div class="turn-speaker"><span class="avatar ${key === "agent-a" ? "avatar-a" : "avatar-b"}">${letter}</span><div><strong>${safeText(who)}</strong><small>${safeText(role)}</small></div></div><div class="turn-metrics">${safeText(model)}<br>${safeText(meta)}</div></div><div class="turn-body"></div>`;
  const body = card.querySelector(".turn-body");
  body.textContent = initial;
  $("transcript").append(card);
  scrollTranscript();
  $("exportBtn").disabled = state.turns.length === 0 && !initial;
  return body;
}
function appendThinking(label) {
  const el = document.createElement("div");
  el.className = "thinking-row";
  el.innerHTML = `<span class="thinking-dots"><i></i><i></i><i></i></span><span>${safeText(label)}</span>`;
  $("transcript").append(el);
  scrollTranscript();
  return el;
}
function markdownLite(text) {
  // Deliberately limited formatting: escape HTML first, then support emphasis and line breaks.
  return safeText(text).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}
function appendResolution(text) {
  const card = document.createElement("section");
  card.className = "resolution-card";
  card.innerHTML = `<span class="section-kicker">CASE FILE / CURRENT CONCLUSION</span><h3>What the team has established</h3><p>${markdownLite(text)}</p>`;
  $("transcript").append(card);
  scrollTranscript();
}
function contextFor(nextWho) {
  const log = state.turns.map((t, i) => `\n[${i + 1} · ${t.who} / ${t.role}]\n${t.text}`).join("\n");
  return `INVESTIGATION BRIEF\n${$("mission").value.trim()}\n\nSHARED INVESTIGATION LOG${log || "\nNo replies yet. You are opening the investigation."}\n\nIt is now ${nextWho}'s turn. Respond directly to the latest contribution where one exists. Add a useful observation, question, test, or correction. Do not simply repeat the previous reply. Do not pretend unverified details are facts. Keep your reply focused (about 120–180 words).`;
}
function systemFor(who) {
  if (who === "ARIA") return "You are ARIA, the Field Analyst in Signal Room. You are observant, precise, and evidence-first. Separate observations from hypotheses. Ask what can be measured, notice anomalies, and propose safe next tests. You are collaborating with VEGA, not competing. Speak naturally in first person as a teammate. Do not invent sources, measurements, or events.";
  return "You are VEGA, the Systems Thinker in Signal Room. You connect clues, challenge unsupported assumptions, and propose alternative explanations or experiments that distinguish them. You are collaborating with ARIA, not competing. Speak naturally in first person as a teammate. Be constructive, precise, and honest about uncertainty. Do not invent sources, measurements, or events.";
}
function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part?.text ?? "").join("");
  return "";
}
async function streamReply(model, who, onDelta) {
  const response = await fetch(API, {
    method: "POST",
    signal: state.controller.signal,
    headers: { "Authorization": `Bearer ${state.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemFor(who) },
        { role: "user", content: contextFor(who) },
      ],
      temperature: 0.75,
      max_tokens: 900,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Pollinations returned ${response.status}: ${detail || response.statusText}`);
  }
  if (!response.body) throw new Error("The model response did not include a readable stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", text = "", usage = null, finished = false;
  const processBlock = (block) => {
    for (const line of block.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") { if (payload === "[DONE]") finished = true; continue; }
      let item;
      try { item = JSON.parse(payload); } catch { continue; }
      if (item.usage) usage = item.usage;
      const delta = extractText(item.choices?.[0]?.delta?.content);
      if (delta) { text += delta; onDelta(delta); }
      const complete = extractText(item.choices?.[0]?.message?.content);
      if (complete && !text) { text = complete; onDelta(complete); }
    }
  };
  while (!finished) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    for (const block of blocks) processBlock(block);
  }
  if (buffer.trim()) processBlock(buffer);
  if (!text.trim()) throw new Error("The model returned an empty reply. Try another model or a shorter brief.");
  return { text: text.trim(), usage };
}
async function runInvestigation() {
  if (!state.apiKey) { toast("Connect your own Pollen before starting a live investigation."); openConnect(); return; }
  const mission = $("mission").value.trim();
  if (mission.length < 20) { toast("Add a little more detail to the transmission first."); $("mission").focus(); return; }
  resetTranscript();
  state.caseNumber += 1;
  const total = Number($("rounds").value) * 2;
  const modelA = $("modelA").value;
  const modelB = $("modelB").value;
  setSignal("Incoming transmission locked", "Two analysts are being briefed. Each reply uses your approved Pollen budget.");
  $("caseIndex").textContent = String(state.caseNumber).padStart(3, "0");
  setRoom("running", "INVESTIGATING");
  setProgress(0, total, "BRINGING ANALYSTS ONLINE");
  setBusy(true);
  state.controller = new AbortController();
  state.startedAt = performance.now();
  let completed = 0;
  try {
    for (let round = 0; round < total / 2; round += 1) {
      for (const [who, role, model] of [["ARIA", "FIELD ANALYST", modelA], ["VEGA", "SYSTEMS THINKER", modelB]]) {
        if (state.controller.signal.aborted) throw new DOMException("Stopped by user", "AbortError");
        setProgress(completed, total, `ROUND ${round + 1} / ${total / 2} · ${who} IS THINKING`);
        const thinking = appendThinking(`${who} is examining the shared evidence…`);
        const started = performance.now();
        let body;
        try {
          body = appendTurnCard(who, role, model, "", "STREAMING");
          const result = await streamReply(model, who, (delta) => {
            body.innerHTML = `${markdownLite(body.textContent + delta)}<span class="turn-cursor"></span>`;
            scrollTranscript();
          });
          const elapsed = Math.round(performance.now() - started);
          body.innerHTML = markdownLite(result.text);
          body.closest(".turn-card").querySelector(".turn-metrics").innerHTML = `${safeText(model)}<br>${elapsed} ms`;
          state.turns.push({ who, role, model, text: result.text, latency: `${elapsed} ms`, usage: result.usage ?? null });
          state.totalMs += elapsed;
        } finally {
          thinking.remove();
        }
        completed += 1;
        $("exportBtn").disabled = false;
        setProgress(completed, total, completed === total ? "INVESTIGATION COMPLETE" : "EVIDENCE ADDED TO SHARED LOG");
        const totalTokens = state.turns.reduce((sum, t) => sum + Number(t.usage?.completion_tokens ?? 0), 0);
        $("usageText").textContent = totalTokens ? `${totalTokens.toLocaleString()} output tokens reported` : `${completed} model replies received`;
        $("latencyText").textContent = `${(state.totalMs / 1000).toFixed(1)} s model time`;
      }
    }
    appendResolution("The team has completed its planned exchange. Review the hypotheses and proposed tests above; the investigation log is evidence to evaluate, not proof that the mystery is solved.");
    setRoom("done", "CASE LOGGED");
    setSignal("Transmission analyzed", "The team has finished its exchange. Export the case file or run another investigation.");
    toast("Investigation complete. Your case file is ready to export.");
  } catch (error) {
    if (error.name === "AbortError") {
      setRoom("done", "STOPPED BY USER");
      setSignal("Investigation paused", "The partial transcript is preserved. You can export the replies received so far.");
      toast("Stopped. Partial investigation saved in the room.");
    } else {
      setRoom("done", "REQUEST ERROR");
      setSignal("Signal interrupted", "The partial transcript is preserved. Check your connection, budget, and model selection.");
      const errorCard = document.createElement("div");
      errorCard.className = "resolution-card";
      errorCard.innerHTML = `<span class="section-kicker">CONNECTION REPORT</span><h3>One request could not finish</h3><p>${safeText(error.message)}</p>`;
      $("transcript").append(errorCard);
      toast("A model request failed. The partial transcript is still available.");
    }
  } finally {
    setBusy(false);
    state.controller = null;
    $("exportBtn").disabled = state.turns.length === 0;
    if (!state.turns.length) setProgress(0, total, "WAITING FOR INPUT");
  }
}
function loadDemo() {
  if (state.running) return;
  resetTranscript();
  const mission = CASES.lighthouse;
  $("mission").value = mission;
  state.caseNumber += 1;
  $("caseIndex").textContent = String(state.caseNumber).padStart(3, "0");
  setSignal("Offline sample / lighthouse", "A prewritten example. No API call, no Pollen spent.");
  setRoom("done", "DEMO MODE");
  const total = DEMO.length;
  for (let i = 0; i < DEMO.length; i += 1) {
    const t = DEMO[i];
    const body = appendTurnCard(t.who, t.role, t.model, t.text, t.latency);
    body.innerHTML = markdownLite(t.text);
    state.turns.push({ ...t, model: "OFFLINE CASE FILE" });
    setProgress(i + 1, total, "OFFLINE DEMONSTRATION · NO CHARGE");
  }
  appendResolution("The analysts have formed two hypotheses and a safe, testable next-step plan. This sample is prewritten; live investigations use the models you select and charge your approved Pollen budget.");
  $("usageText").textContent = "0 API calls · offline demo";
  $("latencyText").textContent = "No charge";
  $("exportBtn").disabled = false;
}
function exportTranscript() {
  if (!state.turns.length) return;
  const lines = ["# Signal Room — Investigation report", "", `**Transmission:** ${$("mission").value.trim()}`, "", `**Models:** ARIA — ${$("modelA").value}; VEGA — ${$("modelB").value}`, "", "---", ""];
  state.turns.forEach((t, i) => lines.push(`## ${i + 1}. ${t.who} — ${t.role}`, `*${t.model} · ${t.latency ?? ""}*`, "", t.text, ""));
  lines.push("---", "", "*Generated by Signal Room. Model outputs are hypotheses, not verified facts.*");
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `signal-room-case-${String(state.caseNumber).padStart(3, "0")}.md`;
  document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function openConnect() { $("connectOverlay").hidden = false; $("signIn").focus(); }
function closeConnect() { $("connectOverlay").hidden = true; }
// Pollinations asks the visitor to approve this app, then sends them back with
// a key for their own Pollen in the URL fragment: #api_key=sk_...
function signIn() {
  const params = new URLSearchParams({ redirect_uri: location.origin + location.pathname, models: "text" });
  if (APP_KEY) params.set("client_id", APP_KEY);
  location.href = `${ENTER}/authorize?${params}`;
}
function readSignInResult() {
  const hash = new URLSearchParams(location.hash.slice(1));
  if (!hash.has("api_key") && !hash.has("error")) return;
  history.replaceState(null, "", location.pathname + location.search);
  state.apiKey = hash.get("api_key");
  if (state.apiKey) {
    sessionStorage.setItem(KEY_STORE, state.apiKey);
    toast("Pollinations connected. Live investigations are ready.");
  } else toast("Sign-in was cancelled.");
}
function updateConnectionStatus() {
  const status = $("connectionStatus");
  const top = $("connectOpen");
  if (state.apiKey) {
    status.textContent = "Connected · your scoped key is available in this tab";
    status.classList.add("connected");
    top.textContent = "Pollen connected ✓";
  } else {
    status.textContent = "Not connected · sign in with Pollinations";
    status.classList.remove("connected");
    top.innerHTML = 'Connect Pollen <span aria-hidden="true">↗</span>';
  }
}
async function loadModels() {
  try {
    const response = await fetch(MODELS_API, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error(`catalog ${response.status}`);
    const payload = await response.json();
    const rows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.models) ? payload.models : [];
    const models = rows.filter((m) => {
      const id = String(m.id ?? "");
      const modalities = m.output_modalities ?? m.architecture?.output_modalities ?? [];
      const endpoint = m.supported_endpoints ?? m.endpoints ?? [];
      if (!id) return false;
      if (Array.isArray(modalities) && modalities.length) return modalities.includes("text");
      if (Array.isArray(endpoint) && endpoint.length) return endpoint.some((e) => String(e).includes("chat") || String(e).includes("text"));
      return !/(flux|imagen|veo|video|tts|whisper|embedding|dall-e)/i.test(id);
    }).map((m) => String(m.id)).sort((a,b)=>a.localeCompare(b));
    const unique = [...new Set([...FALLBACK_MODELS, ...models])];
    for (const id of ["modelA", "modelB"]) {
      const select = $(id), old = select.value;
      select.innerHTML = "";
      unique.forEach((model) => { const option = document.createElement("option"); option.value = model; option.textContent = model; select.append(option); });
      if (unique.includes(old)) select.value = old;
    }
    $("modelStatus").textContent = `Model catalogue loaded · ${models.length} text-capable entries available`;
  } catch (error) {
    $("modelStatus").textContent = "Using fallback model list · live catalogue unavailable";
  }
}
function init() {
  document.querySelectorAll("[data-case]").forEach((button) => button.addEventListener("click", () => {
    $("mission").value = CASES[button.dataset.case];
    toast("Case brief loaded.");
  }));
  $("startBtn").addEventListener("click", runInvestigation);
  $("stopBtn").addEventListener("click", () => state.controller?.abort());
  $("demoBtn").addEventListener("click", loadDemo);
  $("exportBtn").addEventListener("click", exportTranscript);
  $("connectOpen").addEventListener("click", openConnect);
  $("connectClose").addEventListener("click", closeConnect);
  $("connectOverlay").addEventListener("click", (event) => { if (event.target === $("connectOverlay")) closeConnect(); });
  $("signIn").addEventListener("click", signIn);
  readSignInResult();
  updateConnectionStatus();
  loadModels();
}
document.addEventListener("DOMContentLoaded", init);

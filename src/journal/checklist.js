// src/journal/checklist.js

export function normalizeMarkers(html) {
  let s = String(html ?? "");
  s = s.replace(/<input[^>]*type=['"]checkbox['"][^>]*checked[^>]*>/gi, "☑");
  s = s.replace(/<input[^>]*type=['"]checkbox['"][^>]*>/gi, "☐");
  s = s.replace(/\[\s*\]/g, "☐");
  s = s.replace(/\[\s*[xX]\s*\]/g, "☑");
  s = s.replace(/<label[^>]*>/gi, "").replace(/<\/label>/gi, "");
  return s;
}

export function extractModuleChecklist(html) {
  const doc = new DOMParser().parseFromString(String(html ?? ""), "text/html");
  const ul = doc.querySelector("ul.lgmp-checklist") || doc.querySelector("ul");
  if (!ul) return { bodyWithoutChecklist: html, items: [] };
  const items = [];
  for (const li of ul.querySelectorAll("li")) {
    const raw = stripTags(li.innerHTML).trim();
    const { marker, text } = splitMarker(raw);
    if (!text) continue;
    const checked = marker === "☑";
    items.push({ text, checked });
  }
  ul.remove();
  return { bodyWithoutChecklist: doc.body.innerHTML, items };
}

export function renderChecklist(texts) {
  const items = texts.map(t => `<li>☐ ${escapeHtml(t)}</li>`).join("\n");
  return `<ul class="lgmp-checklist">\n${items}\n</ul>\n`;
}

export function topUpToTen(texts, label = "Clue") {
  const out = [...texts];
  while (out.length < 10) out.push(label);
  return out.slice(0, 10);
}

// Utility functions
function stripTags(s) {
  return String(s ?? "").replace(/<[^>]+>/g, "");
}

function splitMarker(line) {
  const trimmed = String(line ?? "").trim();
  if (/^☑\s*/.test(trimmed)) return { marker: "☑", text: trimmed.replace(/^☑\s*/, "") };
  if (/^☐\s*/.test(trimmed)) return { marker: "☐", text: trimmed.replace(/^☐\s*/, "") };
  if (/^\[\s*[xX]\s*\]\s*/.test(trimmed)) return { marker: "☑", text: trimmed.replace(/^\[\s*[xX]\s*\]\s*/, "") };
  if (/^\[\s*\]\s*/.test(trimmed)) return { marker: "☐", text: trimmed.replace(/^\[\s*\]\s*/, "") };
  return { marker: "", text: trimmed };
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&", "<": "<", ">": ">", '"': "\"", "'": "&#39;" }[m]));
}

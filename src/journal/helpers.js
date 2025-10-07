// src/journal/helpers.js

export async function ensureFolder(name) {
  if (!name) return null;
  const existing = game.folders?.find(f => f.type === "JournalEntry" && f.name === name);
  if (existing) return existing.id;
  const f = await Folder.create({ name, type: "JournalEntry", color: "#6d712d" });
  return f?.id ?? null;
}

export function nextSequenceNumber(prefix) {
  const existing = (game.journal?.contents ?? []).filter(j => j.name?.startsWith(prefix));
  if (!existing.length) return 0;
  const nums = existing
    .map(j => j.name.match(/\b(\d+)\b/)?.[1] ?? null)
    .map(n => (n ? parseInt(n, 10) : 0));
  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}

export function findPreviousSession(prefix) {
  const list = (game.journal?.contents ?? [])
    .filter(j => j.name?.startsWith(prefix))
    .map(j => {
      const n = j.name.match(/\b(\d+)\b/)?.[1] ?? null;
      return { num: n ? parseInt(n, 10) : 0, journal: j };
    })
    .sort((a, b) => b.num - a.num);
  return list.length ? list[0].journal : null;
}

export function getPreviousSectionHTML(prevJournal, def) {
  if (!prevJournal) return null;
  try {
    const wantedTitle = game.i18n.localize(def.titleKey);
    // Separate-page lookup
    const separatePage = prevJournal.pages.find(p => (p.name ?? "") === wantedTitle);
    if (separatePage?.text?.content) return separatePage.text.content;
    // Combined-page extraction
    const combinedName = game.i18n.localize("lazy-gm-prep.module.name");
    const combinedHost =
      prevJournal.pages.find(p => (p.name ?? "") === combinedName && p.text?.content) ||
      prevJournal.pages.find(p => p.type === "text" && p.text?.content);
    if (!combinedHost?.text?.content) return null;
    return extractCombinedSection(combinedHost.text.content, wantedTitle);
  } catch (err) {
    console.warn("previous section fetch failed", err);
    return null;
  }
}

function extractCombinedSection(pageHtml, sectionTitle) {
  try {
    const doc = new DOMParser().parseFromString(String(pageHtml ?? ""), "text/html");
    const headers = Array.from(doc.querySelectorAll("h2"));
    const target = headers.find(
      h => (h.textContent ?? "").trim() === String(sectionTitle ?? "").trim()
    );
    if (!target) return null;
    const container = doc.createElement("div");
    let node = target.nextSibling;
    while (node) {
      if (node.nodeType === 1 && node.tagName?.toLowerCase() === "h2") break;
      container.appendChild(node.cloneNode(true));
      node = node.nextSibling;
    }
    return container.innerHTML;
  } catch {
    return null;
  }
}

// ---------- Section UI helpers ----------
export function sectionDescription(def) {
  const desc = game.i18n.localize(def.descKey);
  return `<p class="lgmp-step-desc">${escapeHtml(desc)}</p>\n<hr>\n`;
}

export function quickCheckHTML() {
  const title = game.i18n.localize('lazy-gm-prep.characters.quickcheck.title');
  const prompt = game.i18n.localize('lazy-gm-prep.characters.quickcheck.prompt');
  return `<blockquote><strong>${escapeHtml(title)}</strong> ${escapeHtml(prompt)}</blockquote>\n`;
}

export function notesPlaceholder() {
  const hint = game.i18n.localize("lazy-gm-prep.ui.add-notes-here") ?? "Add your notes here.";
  return `<p class="lgmp-notes-hint">${escapeHtml(hint)}</p>\n`;
}

// ---------- Table generators ----------
export function characterReviewTableHTML(rowCount = 5) {
  const headers = [
    game.i18n.localize("lazy-gm-prep.characters.table.header.pcName"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.conceptRole"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.goalHook"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.recentNote")
  ].map(escapeHtml);
  const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  const bodyRows = Array.from({ length: rowCount }, () =>
    `<tr>${" <td> </td>".repeat(headers.length)}</tr>`
  ).join("\n");
  return `<table class="lgmp-table lgmp-characters">
${headerRow}
${bodyRows}
</table>\n`;
}

export function importantNpcsTableHTML(rowCount = 5) {
  const headers = [
    game.i18n.localize("lazy-gm-prep.npcs.table.header.name"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.connection"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.archetype"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.goal"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.relationship"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.notes")
  ].map(escapeHtml);
  const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  const bodyRows = Array.from({ length: rowCount }, () =>
    `<tr>${" <td> </td>".repeat(headers.length)}</tr>`
  ).join("\n");
  return `<table class="lgmp-table lgmp-npcs">
${headerRow}
${bodyRows}
</table>\n`;
}

/** Legacy (kept) */
export function gmReviewPromptsHTML() {
  const lines = [
    game.i18n.localize("lazy-gm-prep.characters.prompts.spotlight"),
    game.i18n.localize("lazy-gm-prep.characters.prompts.unresolved"),
    game.i18n.localize("lazy-gm-prep.characters.prompts.bonds"),
    game.i18n.localize("lazy-gm-prep.characters.prompts.reward")
  ].map(escapeHtml);
  return `<ul class="lgmp-prompts">
${lines.map(l => `<li>${l}</li>`).join("\n")}
</ul>\n`;
}

/**
 * Generic collapsible Prompts block used by all pages.
 * Defaults to collapsed.
 * @param {string[]} promptKeys - i18n keys for the list items.
 * @param {string} [headingKey="lazy-gm-prep.prompts.heading"] - i18n key for the summary label.
 * @param {boolean} [open=false] - open state.
 */
export function renderPromptsBlock(promptKeys, headingKey = "lazy-gm-prep.prompts.heading", open = false) {
  const t = (k) => game.i18n.localize(k);
  const heading = t(headingKey);
  const items = promptKeys.map(t).map(escapeHtml);

  return `
<details class="lgmp-prompts"${open ? " open" : ""}>
  <summary>${escapeHtml(heading)}</summary>
  <ul class="lgmp-prompts">
    ${items.map((l) => `<li>${l}</li>`).join("\n")}
  </ul>
</details>
`;
}

/** Compatibility wrapper for Secrets & Clues */
export function secretsPromptsHTML() {
  const keys = [
    "lazy-gm-prep.secrets-clues.prompts.rumor",
    "lazy-gm-prep.secrets-clues.prompts.secretPast",
    "lazy-gm-prep.secrets-clues.prompts.artifact",
    "lazy-gm-prep.secrets-clues.prompts.mystery"
  ];
  return renderPromptsBlock(keys, "lazy-gm-prep.secrets-clues.prompts.heading", false);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&",
    "<": "<",
    ">": ">",
    '"': "\"",
    "'": "&#39;"
  }[m]));
}

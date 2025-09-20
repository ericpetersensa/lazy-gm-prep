// src/journal/generator.js
// ============================================================================
//  Lazy GM Prep - Journal Generator (AppV2, Foundry VTT v13+)
//  - Creates per-session prep journals following "Return of the Lazy DM" steps
//  - Separate vs. Combined page modes
//  - Session 0 special "0. Getting Started" page/section
//  - Secrets & Clues copy-forward (unchecked only) with top-up to 10
//  - Characters and Important NPCs editor-friendly tables
//  - Session numbering starts at 0; Session 0 IS a copy source
//  - Combined-mode copy: extracts prior section HTML by <h2> section title
//  - Getting Started includes a styled <button data-lazy-open-settings> to open settings
// ============================================================================

import { MODULE_ID, SETTINGS } from "../constants.js";
import { PAGE_ORDER, getSetting } from "../settings.js";

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a new GM Prep journal for the next session.
 * - Session 0: inject "0. Getting Started" (separate page or top section in combined).
 * - Separate pages: one page per step; no in-body H2 (name is the title).
 * - Combined page: one page with H2 sections; same copy logic per section.
 * - "Secrets & Clues": copy UNCHECKED only from previous, then top up to 10.
 * - Normalize legacy checkboxes ([ ], [x], <input type="checkbox">) to ☐ / ☑.
 * - Characters/NPCs: provide editor-friendly plain tables.
 * - Numbering: first journal is 0; Session 0 IS a valid copy source (so S0 → S1 works).
 */
export async function createPrepJournal() {
  const separate    = !!getSetting(SETTINGS.separatePages, true);
  const folderName  = getSetting(SETTINGS.folderName, "GM Prep");
  const prefix      = getSetting(SETTINGS.journalPrefix, "Session");
  const includeDate = !!getSetting("includeDateInName", true);

  const folderId = await ensureFolder(folderName);
  const seq      = nextSequenceNumber(prefix);  // first in a world -> 0
  const isFirst  = seq === 0;

  const entryName = includeDate
    ? `${prefix} ${seq}: ${new Date().toLocaleDateString()}`
    : `${prefix} ${seq}`;

  // NOTE: We now allow Session 0 to be a copy source (so S0 -> S1 works).
  const prev = findPreviousSession(prefix);

  if (separate) {
    return await createSeparatePages(entryName, folderId, prev, isFirst);
  } else {
    return await createCombinedPage(entryName, folderId, prev, isFirst);
  }
}

// ============================================================================
// Separate-Pages mode
// ============================================================================

async function createSeparatePages(entryName, folderId, prevJournal, isFirst) {
  const pages = [];

  // Session 0: Getting Started page
  if (isFirst) {
    pages.push({
      name: game.i18n.localize("lazy-gm-prep.getting-started.title"),
      type: "text",
      text: { format: 1, content: gettingStartedBodyHTML({ prefix: getSetting(SETTINGS.journalPrefix, "Session") }) }
    });
  }

  // Standard steps
  for (const def of PAGE_ORDER) {
    const copyOn = !!getSetting(`copy.${def.key}`, true);
    const prevContent = copyOn ? getPreviousSectionHTML(prevJournal, def) : null;

    // --- "4. Define Secrets & Clues" ---
    if (def.key === "secrets-clues") {
      const content = buildSecretsContentSeparate(def, prevContent);
      pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
      continue;
    }

    // --- "1. Review the Characters" ---
    if (def.key === "review-characters") {
      const initialRows = Number(getSetting(SETTINGS.initialCharacterRows, 5)) || 5;
      const content = buildCharactersContentSeparate(def, prevContent, initialRows);
      pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
      continue;
    }

    // --- "6. Outline Important NPCs" ---
    if (def.key === "important-npcs") {
      const initialRows = Number(getSetting(SETTINGS.initialNpcRows, 5)) || 5;
      const content = buildImportantNpcsContentSeparate(def, prevContent, initialRows);
      pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
      continue;
    }

    // --- Other sections ---
    const content = buildDefaultSectionContentSeparate(def, prevContent);
    pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
  }

  const entry = await JournalEntry.create({ name: entryName, folder: folderId, pages });
  ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
  return entry;
}

function buildSecretsContentSeparate(def, prevContent) {
  if (prevContent) {
    const normalized = normalizeMarkers(
      scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false })
    );
    const { bodyWithoutChecklist, items } = extractModuleChecklist(normalized);
    const uncheckedTexts = items.filter(i => !i.checked).map(i => i.text.trim());
    const toRender = topUpToTen(uncheckedTexts, "Clue");
    const bodyCore = bodyWithoutChecklist?.trim() ? `${bodyWithoutChecklist.trim()}\n` : "";
    let content = `${bodyCore}${renderChecklist(toRender)}`;
    if (!bodyCore) content = sectionDescription(def) + notesPlaceholder() + content;
    return content;
  } else {
    return sectionDescription(def) + notesPlaceholder() + renderChecklist(topUpToTen([], "Clue"));
  }
}

function buildCharactersContentSeparate(def, prevContent, initialRows) {
  if (prevContent) {
    let content = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false });
    if (!content.trim()) {
      content =
        sectionDescription(def) +
        characterReviewTableHTML(initialRows) +
        gmReviewPromptsHTML() +
        notesPlaceholder();
    }
    return content;
  } else {
    return (
      sectionDescription(def) +
      characterReviewTableHTML(initialRows) +
      gmReviewPromptsHTML() +
      notesPlaceholder()
    );
  }
}

function buildImportantNpcsContentSeparate(def, prevContent, initialRows) {
  if (prevContent) {
    let content = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false });
    if (!content.trim()) content = sectionDescription(def) + importantNpcsTableHTML(initialRows) + notesPlaceholder();
    return content;
  } else {
    return sectionDescription(def) + importantNpcsTableHTML(initialRows) + notesPlaceholder();
  }
}

function buildDefaultSectionContentSeparate(def, prevContent) {
  if (prevContent) {
    let content = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false });
    if (!content.trim()) content = sectionDescription(def) + notesPlaceholder();
    return content;
  } else {
    return sectionDescription(def) + notesPlaceholder();
  }
}

// ============================================================================
// Combined-Page mode
// ============================================================================

async function createCombinedPage(entryName, folderId, prevJournal, isFirst) {
  const chunks = [];

  // Session 0: Getting Started top section
  if (isFirst) {
    const h2 = `<h2 style="margin:0">${escapeHtml(game.i18n.localize("lazy-gm-prep.getting-started.title"))}</h2>\n`;
    chunks.push(`${h2}${gettingStartedBodyHTML({ prefix: getSetting(SETTINGS.journalPrefix, "Session") })}`);
  }

  for (const def of PAGE_ORDER) {
    const copyOn = !!getSetting(`copy.${def.key}`, true);
    const prevContent = copyOn ? getPreviousSectionHTML(prevJournal, def) : null;

    const headerHtml = sectionHeader(def) + sectionDescription(def);

    // "4. Define Secrets & Clues"
    if (def.key === "secrets-clues") {
      let bodyHtml;
      if (prevContent) {
        const normalized = normalizeMarkers(
          scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: true })
        );
        const { bodyWithoutChecklist, items } = extractModuleChecklist(normalized);
        const uncheckedTexts = items.filter(i => !i.checked).map(i => i.text.trim());
        const toRender = topUpToTen(uncheckedTexts, "Clue");
        bodyHtml = `${(bodyWithoutChecklist?.trim() ?? "")}${renderChecklist(toRender)}`;
        if (!bodyWithoutChecklist?.trim()) bodyHtml = notesPlaceholder() + bodyHtml;
      } else {
        bodyHtml = notesPlaceholder() + renderChecklist(topUpToTen([], "Clue"));
      }
      chunks.push(`${headerHtml}${bodyHtml}`);
      continue;
    }

    // "1. Review the Characters"
    if (def.key === "review-characters") {
      let bodyHtml;
      const initialRows = Number(getSetting(SETTINGS.initialCharacterRows, 5)) || 5;
      if (prevContent) {
        bodyHtml = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: true });
        if (!bodyHtml.trim()) bodyHtml = characterReviewTableHTML(initialRows) + gmReviewPromptsHTML() + notesPlaceholder();
      } else {
        bodyHtml = characterReviewTableHTML(initialRows) + gmReviewPromptsHTML() + notesPlaceholder();
      }
      chunks.push(`${headerHtml}${bodyHtml}`);
      continue;
    }

    // "6. Outline Important NPCs"
    if (def.key === "important-npcs") {
      let bodyHtml;
      const initialRows = Number(getSetting(SETTINGS.initialNpcRows, 5)) || 5;
      if (prevContent) {
        bodyHtml = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: true });
        if (!bodyHtml.trim()) bodyHtml = importantNpcsTableHTML(initialRows) + notesPlaceholder();
      } else {
        bodyHtml = importantNpcsTableHTML(initialRows) + notesPlaceholder();
      }
      chunks.push(`${headerHtml}${bodyHtml}`);
      continue;
    }

    // Other sections
    let bodyHtml;
    if (prevContent) {
      bodyHtml = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: true });
      if (!bodyHtml.trim()) bodyHtml = notesPlaceholder();
    } else {
      bodyHtml = notesPlaceholder();
    }
    chunks.push(`${headerHtml}${bodyHtml}`);
  }

  const entry = await JournalEntry.create({
    name: entryName,
    folder: folderId,
    pages: [
      {
        name: game.i18n.localize("lazy-gm-prep.module.name"),
        type: "text",
        text: { format: 1, content: chunks.join("\n<hr/>\n") }
      }
    ]
  });
  ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
  return entry;
}

// ============================================================================
// Section Builders (headers, descriptions, placeholders)
// ============================================================================

function sectionHeader(def) {
  const title = game.i18n.localize(def.titleKey);
  return `<h2 style="margin:0">${escapeHtml(title)}</h2>\n`;
}

function sectionDescription(def) {
  const desc = game.i18n.localize(def.descKey);
  return `<p class="lgmp-step-desc">${escapeHtml(desc)}</p>\n<hr/>\n`;
}

function notesPlaceholder() {
  const hint = game.i18n.localize("lazy-gm-prep.ui.add-notes-here") ?? "Add your notes here.";
  return `<p><em>${escapeHtml(hint)}</em></p>\n`;
}

// ============================================================================
// Getting Started (Session 0) content
// ============================================================================

/**
 * Plain body (no H2) for separate-pages mode; also used as body chunk in combined mode.
 * This version reflects:
 * - "Quick Start" -> "Other Journal Creation Options"
 * - Updated "Editable Tables" bullet
 * - Updated "Actors, NPCs, and other items" bullet
 * - Real <button data-lazy-open-settings> (no navigation/new tab)
 */
function gettingStartedBodyHTML({ prefix }) {
  // Updated heading per user request
  const otherOptionsTitle = "Other Journal Creation Options";

  const settingsTitle = escapeHtml(game.i18n.localize("lazy-gm-prep.getting-started.settings.title"));
  const knowTitle     = escapeHtml(game.i18n.localize("lazy-gm-prep.getting-started.know.title"));

  // Settings labels from i18n (keep consistent with Settings UI)
  const separatePagesLabel = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.separatePages.name"));
  const folderNameLabel    = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.folderName.name"));
  const prefixLabel        = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.journalPrefix.name"));
  const includeDateLabel   = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.includeDateInName.name"));

  return `
<p class="lgmp-step-desc">
Welcome! This module generates a lightweight prep journal that follows the “Return of the Lazy Dungeon Master” flow.
You’re on <strong>${escapeHtml(prefix)} 0</strong>. From here on, you’ll create a new journal per session.
</p>

<h3 style="margin:0.5rem 0 0">${otherOptionsTitle}</h3>
<ol>
  <li>Press <kbd>Alt</kbd>+<kbd>P</kbd> (GM only) to create the next prep journal.</li>
  <li>Type <code>/prep</code> in chat to generate a new prep journal.</li>
</ol>

<h3 style="margin:0.75rem 0 0">${settingsTitle}</h3>
<ul>
  <li><strong>${separatePagesLabel}</strong>: A checkmark means that each step will have its own page. With it unchecked, all steps are combined into a single page. <em>(Default – Enabled)</em></li>
  <li><strong>${folderNameLabel}</strong>: Type the folder name you want journals to be created under. <em>(Default – Lazy GM Prep)</em></li>
  <li><strong>${prefixLabel}</strong>: Type the journal name you want used. <em>(Default – Session)</em></li>
  <li><strong>${includeDateLabel}</strong>: A checkmark means that it will append the date on to the name of the journal <em>(Default – Enabled)</em></li>
  <li><strong>Default rows in X (Characters and NPC pages)</strong>: While you can add or remove rows manually, this allows you to start with a set number of rows. <em>(Default – 5)</em></li>
  <li><strong>Copy Previous X (All pages)</strong>: Each step can copy prior content or be toggled off if you don't want that page copied to the next journal. <em>(Default – Enabled)</em></li>
</ul>

<h3 style="margin:0.75rem 0 0">${knowTitle}</h3>
<ul>
  <li><strong>Secrets &amp; Clues carry forward:</strong> Only <em>unchecked</em> secrets from the prior session are brought forward and topped up to 10.</li>
  <li><strong>Editable Tables:</strong> Use the standard table options on the Characters and NPC pages to add or remove rows or columns.</li>
  <li><strong>Actors, NPCs, and other items:</strong> Once your players have created their characters, drag and drop them into the “1. Review the Characters” table (one per row) for one‑click access to their character sheets. Same for NPCs and other items.</li>
</ul>

<hr/>
<p style="margin:0.5rem 0 0.25rem">
  <button type="button" class="lgmp-open-settings-btn" data-lazy-open-settings aria-label="Open Module Settings">
    <i class="fa-solid fa-gear" aria-hidden="true"></i><span>Open Module Settings</span>
  </button>
</p>
`.trim() + "\n";
}

// ============================================================================
// Characters table & prompts (editor-friendly)
// ============================================================================

/**
 * Plain <table> constructed so Foundry's editor "Add Row/Column" tools work well.
 * Headers live in the first <tbody> row for simplicity inside the rich editor.
 */
function characterReviewTableHTML(rowCount = 5) {
  const headers = [
    game.i18n.localize("lazy-gm-prep.characters.table.header.pcName"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.player"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.conceptRole"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.goalHook"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.bondDrama"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.recentNote")
  ].map(escapeHtml);

  const cols = headers.length;
  const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  const bodyRows = Array.from({ length: rowCount }, () =>
    `<tr>${"<td></td>".repeat(cols)}</tr>`
  ).join("\n");

  return `
<table>
  <tbody>
${headerRow}
${bodyRows}
  </tbody>
</table>
`.trim() + "\n";
}

function gmReviewPromptsHTML() {
  const lines = [
    game.i18n.localize("lazy-gm-prep.characters.prompts.spotlight"),
    game.i18n.localize("lazy-gm-prep.characters.prompts.unresolved"),
    game.i18n.localize("lazy-gm-prep.characters.prompts.bonds"),
    game.i18n.localize("lazy-gm-prep.characters.prompts.reward")
  ].map(escapeHtml);

  return `
<ul>
  <li>${lines[0]}</li>
  <li>${lines[1]}</li>
  <li>${lines[2]}</li>
  <li>${lines[3]}</li>
</ul>
`.trim() + "\n";
}

// ============================================================================
// Important NPCs table (editor-friendly)
// ============================================================================

function importantNpcsTableHTML(rowCount = 5) {
  const headers = [
    game.i18n.localize("lazy-gm-prep.npcs.table.header.name"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.connection"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.archetype"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.goal"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.relationship"),
    game.i18n.localize("lazy-gm-prep.npcs.table.header.notes")
  ].map(escapeHtml);

  const cols = headers.length;
  const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  const bodyRows = Array.from({ length: rowCount }, () =>
    `<tr>${"<td></td>".repeat(cols)}</tr>`
  ).join("\n");

  return `
<table>
  <tbody>
${headerRow}
${bodyRows}
  </tbody>
</table>
`.trim() + "\n";
}

// ============================================================================
// Checklist rendering & extraction (Secrets & Clues)
// ============================================================================

function renderChecklist(texts) {
  const items = texts.map(t => `<li>☐ ${escapeHtml(t)}</li>`).join("\n");
  return `
<section class="lgmp-section lgmp-checklist">
  <ul class="lgmp-checklist">
${items}
  </ul>
</section>
`.trim() + "\n";
}

function topUpToTen(texts, label = "Clue") {
  const out = [...texts];
  while (out.length < 10) out.push(label);
  return out.slice(0, 10);
}

/**
 * Extract our <ul class="lgmp-checklist"> from HTML and return
 * { bodyWithoutChecklist, items: [{ text, checked }] }.
 * - Accepts markers: "☑"/"☐", "[x]"/"[]", input[type=checkbox].
 * - Normalization happens upstream via normalizeMarkers().
 */
function extractModuleChecklist(html) {
  const UL_RE = /\<ul\s+class=['"]lgmp-checklist['"][\s\S]*?\<\/ul\>/i;
  const match = html.match(UL_RE);
  if (!match) return { bodyWithoutChecklist: html, items: [] };

  const ulHtml = match[0];
  const bodyWithoutChecklist = html.replace(UL_RE, "");

  const items = [];
  const LI_RE = /\<li[^\>]*\>([\s\S]*?)\<\/li\>/gi;
  let m;
  while ((m = LI_RE.exec(ulHtml))) {
    const raw = stripTags(m[1]).trim();
    const { marker, text } = splitMarker(raw);
    if (!text) continue;
    const checked = marker === "☑";
    items.push({ text, checked });
  }
  return { bodyWithoutChecklist, items };
}

/**
 * Normalize user/legacy checkbox markup to "☐"/"☑" for durable parsing:
 * - <input type="checkbox"> → ☐
 * - <input type="checkbox" checked> → ☑
 * - [] → ☐
 * - [x]/[X] → ☑
 * - Strip <label> wrappers
 */
function normalizeMarkers(html) {
  let s = String(html ?? "");
  s = s.replace(/\<input[^\>]*type=['"]checkbox['"][^\>]*checked[^\>]*\>/gi, "☑");
  s = s.replace(/\<input[^\>]*type=['"]checkbox['"][^\>]*\>/gi, "☐");
  s = s.replace(/\[\s*\]/g, "☐");
  s = s.replace(/\[\s*[xX]\s*\]/g, "☑");
  s = s.replace(/\<label[^\>]*\>/gi, "").replace(/\<\/label\>/gi, "");
  return s;
}

/**
 * Scrub content from a previous section:
 * - stripTitle: remove any <h1>/<h2> title occurrences of this section
 * - stripLegacyHeader: remove legacy ".lgmp-header" container blocks
 * - stripDesc: remove the description paragraph and a leading <hr/> if present
 */
function scrubContent(rawHtml, def, { stripTitle = true, stripLegacyHeader = true, stripDesc = false } = {}) {
  let html = String(rawHtml ?? "");

  if (stripLegacyHeader) {
    html = html.replace(/\<div\s+class=['"]lgmp-header['"][\s\S]*?\<\/div\>/i, "");
  }

  if (stripTitle) {
    const titleText = game.i18n.localize(def.titleKey);
    const reTitle = new RegExp(
      `\\<h[12][^\\>]*\\>\\s*(?:\\d+\\.\\s*)?${escapeRegExp(titleText)}\\s*\\<\\/h[12]\\>`,
      "i"
    );
    html = html.replace(reTitle, "");
  }

  if (stripDesc) {
    html = html.replace(/\<p[^\>]*class=['"]lgmp-step-desc['"][^\>]*\>[\s\S]*?\<\/p\>/i, "");
    const descText = game.i18n.localize(def.descKey);
    const reDesc = new RegExp(`\\<p[^\\>]*\\>\\s*${escapeRegExp(descText)}\\s*\\<\\/p\\>`, "i");
    html = html.replace(reDesc, "");
    // Common in combined: description followed by <hr/> we don't want duplicated
    html = html.replace(/^\s*\<hr\s*\/?\>\s*/i, "");
  }

  return html;
}

// ============================================================================
// Core helpers: folder, numbering, previous journal/page lookups
// ============================================================================

async function ensureFolder(name) {
  if (!name) return null;
  const existing = game.folders?.find(f => f.type === "JournalEntry" && f.name === name);
  if (existing) return existing.id;
  const f = await Folder.create({ name, type: "JournalEntry", color: "#6d712d" });
  return f?.id ?? null;
}

/**
 * Determine the next sequence number:
 * - First run with no matching entries -> 0
 * - Otherwise -> max number + 1
 */
function nextSequenceNumber(prefix) {
  const existing = (game.journal?.contents ?? []).filter(j => j.name?.startsWith(prefix));
  if (!existing.length) return 0;

  const nums = existing
    .map(j => j.name.match(/\b(\d+)\b/)?.[1] ?? null)
    .map(n => (n ? parseInt(n, 10) : 0));

  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}

/**
 * Find the most recent previous session journal.
 * IMPORTANT: Session 0 IS included as an eligible previous source.
 */
function findPreviousSession(prefix) {
  const list = (game.journal?.contents ?? [])
    .filter(j => j.name?.startsWith(prefix))
    .map(j => {
      const n = j.name.match(/\b(\d+)\b/)?.[1] ?? null;
      return { num: n ? parseInt(n, 10) : 0, journal: j };
    })
    // NOTE: No filter to exclude 0. We WANT Session 0 as a valid source (S0 -> S1).
    .sort((a, b) => b.num - a.num);

  return list.length ? list[0].journal : null;
}

/**
 * Get previous section HTML for either mode:
 * - Separate mode: returns text of the page named exactly like the localized title.
 * - Combined mode: extracts HTML between <h2>Section Title</h2> and the next <h2>.
 */
function getPreviousSectionHTML(prevJournal, def) {
  if (!prevJournal) return null;
  try {
    const wantedTitle = game.i18n.localize(def.titleKey);

    // 1) Separate-page lookup
    const separatePage = prevJournal.pages.find(p => (p.name ?? "") === wantedTitle);
    if (separatePage?.text?.content) return separatePage.text.content;

    // 2) Combined-page extraction
    const combinedName = game.i18n.localize("lazy-gm-prep.module.name");
    const combinedHost =
      prevJournal.pages.find(p => (p.name ?? "") === combinedName && p.text?.content) ||
      prevJournal.pages.find(p => p.type === "text" && p.text?.content);

    if (!combinedHost?.text?.content) return null;

    return extractCombinedSection(combinedHost.text.content, wantedTitle);
  } catch (err) {
    console.warn(`${MODULE_ID} previous section fetch failed`, err);
    return null;
  }
}

/**
 * Extract the HTML chunk of a single section from a combined journal page:
 * - Find <h2>Section Title</h2>
 * - Return everything until the next <h2> or end of document
 */
function extractCombinedSection(pageHtml, sectionTitle) {
  try {
    const doc = new DOMParser().parseFromString(String(pageHtml ?? ""), "text/html");
    const headers = Array.from(doc.querySelectorAll("h2"));
    const target = headers.find(h => (h.textContent || "").trim() === String(sectionTitle || "").trim());
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

// ============================================================================
// String/HTML utilities
// ============================================================================
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>\"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function escapeRegExp(s) {
  return String(s ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripTags(s) {
  return String(s ?? "").replace(/\<\/?[^>]+\>/g, "");
}

/**
 * Split a line into { marker, text }:
 * - Acceptable leading markers:
 *   - "☑ "  -> checked
 *   - "☐ "  -> unchecked
 *   - "[x] " or "[X] " -> checked
 *   - "[] "           -> unchecked
 */
function splitMarker(line) {
  const trimmed = String(line ?? "").trim();
  if (/^☑\s*/.test(trimmed)) return { marker: "☑", text: trimmed.replace(/^☑\s*/, "") };
  if (/^☐\s*/.test(trimmed)) return { marker: "☐", text: trimmed.replace(/^☐\s*/, "") };
  if (/^\[\s*[xX]\s*\]\s*/.test(trimmed)) return { marker: "☑", text: trimmed.replace(/^\[\s*[xX]\s*\]\s*/, "") };
  if (/^\[\s*\]\s*/.test(trimmed)) return { marker: "☐", text: trimmed.replace(/^\[\s*\]\s*/, "") };
  return { marker: "", text: trimmed };
}

// ============================================================================
// End of file
// ============================================================================

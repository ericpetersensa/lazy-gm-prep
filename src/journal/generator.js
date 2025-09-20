// src/journal/generator.js
import { MODULE_ID, SETTINGS } from "../constants.js";
import { PAGE_ORDER, getSetting } from "../settings.js";

/**
 * Create a new GM Prep journal for the next session.
 * - Session 0: inject "0. Getting Started" (separate page or top section in combined).
 * - Separate pages: one page per step; no in-body H2 (name is the title).
 * - Combined page: one page with H2 sections; same copy logic per section.
 * - "Secrets & Clues": copy UNCHECKED only from previous, then top up to 10.
 * - Normalize legacy checkboxes ([ ], [x], <input type="checkbox">) to ☐/☑.
 * - Characters/NPCs: provide editor-friendly plain tables.
 * - Numbering: first journal is 0; Session 0 IS a valid copy source (S0 → S1 works).
 */
export async function createPrepJournal() {
  const separate    = !!getSetting(SETTINGS.separatePages, true);
  const folderName  = getSetting(SETTINGS.folderName, "GM Prep");
  const prefix      = getSetting(SETTINGS.journalPrefix, "Session");
  const includeDate = !!getSetting("includeDateInName", true);

  const folderId = await ensureFolder(folderName);
  const seq      = nextSequenceNumber(prefix);   // first in a world -> 0
  const isFirst  = seq === 0;

  const entryName = includeDate
    ? `${prefix} ${seq}: ${new Date().toLocaleDateString()}`
    : `${prefix} ${seq}`;

  // Previous session (includes Session 0 now)
  const prev = findPreviousSession(prefix);

  if (separate) {
    const pages = [];

    // --- Session 0: Getting Started page
    if (isFirst) {
      pages.push({
        name: game.i18n.localize("lazy-gm-prep.getting-started.title"),
        type: "text",
        text: { format: 1, content: gettingStartedBodyHTML({ prefix }) }
      });
    }

    // --- Standard sections
    for (const def of PAGE_ORDER) {
      const copyOn = !!getSetting(`copy.${def.key}`, true);
      const prevContent = copyOn ? getPreviousSectionHTML(prev, def) : null;

      // Secrets & Clues
      if (def.key === "secrets-clues") {
        let content;
        if (prevContent) {
          const normalized = normalizeMarkers(
            scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false })
          );
          const { bodyWithoutChecklist, items } = extractModuleChecklist(normalized);
          const uncheckedTexts = items.filter(i => !i.checked).map(i => i.text.trim());
          const toRender = topUpToTen(uncheckedTexts, "Clue");
          const bodyCore = bodyWithoutChecklist?.trim() ? `${bodyWithoutChecklist.trim()}\n` : "";
          content = `${bodyCore}${renderChecklist(toRender)}`;
          if (!bodyCore) content = sectionDescription(def) + notesPlaceholder() + content;
        } else {
          content = sectionDescription(def) + notesPlaceholder() + renderChecklist(topUpToTen([], "Clue"));
        }
        pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
        continue;
      }

      // Review the Characters
      if (def.key === "review-characters") {
        let content;
        const initialRows = Number(getSetting(SETTINGS.initialCharacterRows, 5)) || 5;
        if (prevContent) {
          content = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false });
          if (!content.trim()) {
            content =
              sectionDescription(def) +
              characterReviewTableHTML(initialRows) +
              gmReviewPromptsHTML() +
              notesPlaceholder();
          }
        } else {
          content =
            sectionDescription(def) +
            characterReviewTableHTML(initialRows) +
            gmReviewPromptsHTML() +
            notesPlaceholder();
        }
        pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
        continue;
      }

      // Important NPCs
      if (def.key === "important-npcs") {
        let content;
        const initialRows = Number(getSetting(SETTINGS.initialNpcRows, 5)) || 5;
        if (prevContent) {
          content = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false });
          if (!content.trim()) {
            content = sectionDescription(def) + importantNpcsTableHTML(initialRows) + notesPlaceholder();
          }
        } else {
          content = sectionDescription(def) + importantNpcsTableHTML(initialRows) + notesPlaceholder();
        }
        pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
        continue;
      }

      // Others
      let content;
      if (prevContent) {
        content = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false });
        if (!content.trim()) content = sectionDescription(def) + notesPlaceholder();
      } else {
        content = sectionDescription(def) + notesPlaceholder();
      }
      pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
    }

    const entry = await JournalEntry.create({ name: entryName, folder: folderId, pages });
    ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
    return entry;
  }

  // --- Combined single-page mode -------------------------------------------------------
  const chunks = [];

  // Session 0: Getting Started section at the top
  if (isFirst) {
    const h2 = `<h2 style="margin:0">${escapeHtml(game.i18n.localize("lazy-gm-prep.getting-started.title"))}</h2>\n`;
    chunks.push(`${h2}${gettingStartedBodyHTML({ prefix })}`);
  }

  for (const def of PAGE_ORDER) {
    const copyOn = !!getSetting(`copy.${def.key}`, true);
    const prevContent = copyOn ? getPreviousSectionHTML(prev, def) : null;
    const headerHtml = sectionHeader(def) + sectionDescription(def);

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

    if (def.key === "review-characters") {
      let bodyHtml;
      const initialRows = Number(getSetting(SETTINGS.initialCharacterRows, 5)) || 5;
      if (prevContent) {
        bodyHtml = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: true });
        if (!bodyHtml.trim())
          bodyHtml = characterReviewTableHTML(initialRows) + gmReviewPromptsHTML() + notesPlaceholder();
      } else {
        bodyHtml = characterReviewTableHTML(initialRows) + gmReviewPromptsHTML() + notesPlaceholder();
      }
      chunks.push(`${headerHtml}${bodyHtml}`);
      continue;
    }

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

    // Others
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

/* =============================== section builders =============================== */
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

/* =========================== Getting Started (Session 0) =========================== */
function gettingStartedBodyHTML({ prefix }) {
  const quickStartTitle = escapeHtml(game.i18n.localize("lazy-gm-prep.getting-started.quickstart.title"));
  const settingsTitle   = escapeHtml(game.i18n.localize("lazy-gm-prep.getting-started.settings.title"));
  const knowTitle       = escapeHtml(game.i18n.localize("lazy-gm-prep.getting-started.know.title"));

  const separatePagesLabel = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.separatePages.name"));
  const folderNameLabel    = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.folderName.name"));
  const prefixLabel        = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.journalPrefix.name"));
  const includeDateLabel   = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.includeDateInName.name"));

  return `
<p class="lgmp-step-desc">
Welcome! This module generates a lightweight prep journal that follows the “Return of the Lazy Dungeon Master” flow.
You’re on <strong>${escapeHtml(prefix)} 0</strong>. From here on, you’ll create a new journal per session.
</p>

<h3 style="margin:0.5rem 0 0">${quickStartTitle}</h3>
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
  <li><strong>Tables you can edit:</strong> “Review the Characters” and “Important NPCs” start with plain tables designed for the Foundry editor tools.</li>
  <li><strong>Actors, NPCs, and other items:</strong> You can drag and drop items into a journal page while it is in <em>edit</em> mode. Once your players have created their characters, drag and drop them into the “1. Review the Characters” table (one per row) for one‑click access to their character sheets. Same for NPCs.</li>
</ul>

<hr/>
<p style="margin:0.5rem 0 0.25rem">
  <button type="button" class="lgmp-open-settings-btn" data-lazy-open-settings aria-label="Open Module Settings">
    <i class="fa-solid fa-gear" aria-hidden="true"></i><span>Open Module Settings</span>
  </button>
</p>
`.trim() + "\n";
}

/* ============================== Characters table & prompts ============================== */
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

/* ============================== Important NPCs table ============================== */
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

/* ============================== checklist utilities ============================== */
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
/** Extract our <ul class="lgmp-checklist"> and return { bodyWithoutChecklist, items: [{text,checked}] } */
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
function normalizeMarkers(html) {
  let s = String(html ?? "");
  s = s.replace(/\<input[^\>]*type=['"]checkbox['"][^\>]*checked[^\>]*\>/gi, "☑");
  s = s.replace(/\<input[^\>]*type=['"]checkbox['"][^\>]*\>/gi, "☐");
  s = s.replace(/\[\s*\]/g, "☐");
  s = s.replace(/\[\s*[xX]\s*\]/g, "☑");
  s = s.replace(/\<label[^\>]*\>/gi, "").replace(/\<\/label\>/gi, "");
  return s;
}
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
    // Remove a leading <hr/> that often follows the description in combined sections
    html = html.replace(/^\s*\<hr\s*\/?\>\s*/i, "");
  }
  return html;
}

/* ================================== core helpers ================================== */
async function ensureFolder(name) {
  if (!name) return null;
  const existing = game.folders?.find(f => f.type === "JournalEntry" && f.name === name);
  if (existing) return existing.id;
  const f = await Folder.create({ name, type: "JournalEntry", color: "#6d712d" });
  return f?.id ?? null;
}
/** First journal in a world is 0, then 1, 2, ... */
function nextSequenceNumber(prefix) {
  const existing = (game.journal?.contents ?? []).filter(j => j.name?.startsWith(prefix));
  if (!existing.length) return 0;  // first run -> 0
  const nums = existing
    .map(j => j.name.match(/\b(\d+)\b/)?.[1] ?? null)
    .map(n => (n ? parseInt(n, 10) : 0));
  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}
/** Get last session journal (includes Session 0). */
function findPreviousSession(prefix) {
  const list = (game.journal?.contents ?? [])
    .filter(j => j.name?.startsWith(prefix))
    .map(j => {
      const n = j.name.match(/\b(\d+)\b/)?.[1] ?? null;
      return { num: n ? parseInt(n, 10) : 0, journal: j };
    })
    .sort((a, b) => b.num - a.num);
  return list.length ? list[0].journal : null;
}

/**
 * Get previous section HTML for either mode.
 * - Separate mode: returns text of the page whose name == localized title.
 * - Combined mode: finds the combined page, extracts the <h2>Section</h2> chunk.
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

/** Extract HTML between <h2>{sectionTitle}</h2> and the next <h2> (or end). */
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

/* ================================= string utils ================================= */
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>\"']/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
  ));
}
function escapeRegExp(s) {
  return String(s ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function stripTags(s) {
  return String(s ?? "").replace(/\<\/?[^>]+\>/g, "");
}
function splitMarker(line) {
  const trimmed = String(line ?? "").trim();
  if (/^☑\s*/.test(trimmed)) return { marker: "☑", text: trimmed.replace(/^☑\s*/, "") };
  if (/^☐\s*/.test(trimmed)) return { marker: "☐", text: trimmed.replace(/^☐\s*/, "") };
  if (/^\[\s*[xX]\s*\]\s*/.test(trimmed)) return { marker: "☑", text: trimmed.replace(/^\[\s*[xX]\s*\]\s*/, "") };
  if (/^\[\s*\]\s*/.test(trimmed)) return { marker: "☐", text: trimmed.replace(/^\[\s*\]\s*/, "") };
  return { marker: "", text: trimmed };
}

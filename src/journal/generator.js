// src/journal/generator.js
import { MODULE_ID, SETTINGS } from "../constants.js";
import { PAGE_ORDER, getSetting } from "../settings.js";

/**
 * Create a new GM Prep journal for the next session.
 * - Separate pages: no in-body H2 (avoid duplicate with page name).
 * - Fresh "secrets-clues" => description + notes + 10 blank ☐ Clue lines.
 * - Copy "secrets-clues" => rebuild checklist from UNCHECKED items only (top up to 10).
 * - Copy non-secrets => scrub legacy headers/desc; keep content.
 * - Combined page mode: includes H2 per section; same checklist logic.
 * - Normalizes legacy [ ] / [x] and <input type="checkbox"> to ☐ / ☑ before processing.
 */
export async function createPrepJournal() {
  const separate = !!getSetting(SETTINGS.separatePages, true);
  const folderName = getSetting(SETTINGS.folderName, "GM Prep");
  const prefix = getSetting(SETTINGS.journalPrefix, "Session");
  const includeDate = !!getSetting("includeDateInName", true);

  const folderId = await ensureFolder(folderName);
  const seq = nextSequenceNumber(prefix); // next session number based on highest existing
  const entryName = includeDate
    ? `${prefix} ${seq}: ${new Date().toLocaleDateString()}`
    : `${prefix} ${seq}`;

  const prev = findPreviousSession(prefix); // highest-numbered existing session (source)

  if (separate) {
    const pages = [];
    for (const def of PAGE_ORDER) {
      const copyOn = !!getSetting(`copy.${def.key}`, def.key !== "choose-monsters");
      const prevContent = copyOn ? getPreviousPageContent(prev, def) : null;

      if (def.key === "secrets-clues") {
        let content;
        if (prevContent) {
          // Normalize + rebuild from UNCHECKED
          const normalized = normalizeMarkers(
            scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false })
          );
          const { bodyWithoutChecklist, items } = extractModuleChecklist(normalized);
          const uncheckedTexts = items.filter(i => !i.checked).map(i => i.text.trim());
          const toRender = topUpToTen(uncheckedTexts, "Clue");

          const bodyCore = bodyWithoutChecklist?.trim()
            ? `${bodyWithoutChecklist.trim()}\n`
            : "";
          content = `${bodyCore}${renderChecklist(toRender)}`;
          if (!bodyCore) content = sectionDescription(def) + notesPlaceholder() + content;
        } else {
          // Fresh page
          content = sectionDescription(def) + notesPlaceholder() + renderChecklist(topUpToTen([], "Clue"));
        }

        pages.push({ name: game.i18n.localize(def.titleKey), type: "text", text: { format: 1, content } });
        continue;
      }

      // Non-Secrets pages
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

  // Combined single page mode
  const chunks = [];
  for (const def of PAGE_ORDER) {
    const copyOn = !!getSetting(`copy.${def.key}`, def.key !== "choose-monsters");
    const prevContent = copyOn ? getPreviousPageContent(prev, def) : null;
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
    } else {
      let bodyHtml;
      if (prevContent) {
        bodyHtml = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: true });
        if (!bodyHtml.trim()) bodyHtml = notesPlaceholder();
      } else {
        bodyHtml = notesPlaceholder();
      }
      chunks.push(`${headerHtml}${bodyHtml}`);
    }
  }

  const entry = await JournalEntry.create({
    name: entryName,
    folder: folderId,
    pages: [{
      name: game.i18n.localize("lazy-gm-prep.module.name"),
      type: "text",
      text: { format: 1, content: chunks.join("\n<hr/>\n") }
    }]
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
  return `<p class="lgmp-step-desc">${escapeHtml(desc)}</p>\n`;
}
function notesPlaceholder() {
  const hint = game.i18n.localize("lazy-gm-prep.ui.add-notes-here") || "Add your notes here.";
  return `<p><em>${escapeHtml(hint)}</em></p>\n`;
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
`;
}
function topUpToTen(texts, label = "Item") {
  const out = [...texts];
  for (let i = out.length + 1; i <= 10; i++) out.push(`${label} ${i}`);
  return out.slice(0, 10);
}
/** Extract our <ul class="lgmp-checklist"> and return { bodyWithoutChecklist, items: [{text,checked}] } */
function extractModuleChecklist(html) {
  const UL_RE = /<ul\s+class=['"]lgmp-checklist['"][\s\S]*?<\/ul>/i;
  const match = html.match(UL_RE);
  if (!match) return { bodyWithoutChecklist: html, items: [] };

  const ulHtml = match[0];
  const bodyWithoutChecklist = html.replace(UL_RE, "");

  const items = [];
  const LI_RE = /<li[^>]*>([\s\S]*?)<\/li>/gi;
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
  s = s.replace(/<input[^>]*type=['"]checkbox['"][^>]*checked[^>]*>/gi, "☑");
  s = s.replace(/<input[^>]*type=['"]checkbox['"][^>]*>/gi, "☐");
  s = s.replace(/\[\s*\]/g, "☐");
  s = s.replace(/\[\s*\[xX]\s*\]/g, "☑");
  s = s.replace(/<label[^>]*>/gi, "").replace(/<\/label>/gi, "");
  return s;
}
function scrubContent(rawHtml, def, { stripTitle = true, stripLegacyHeader = true, stripDesc = false } = {}) {
  let html = String(rawHtml ?? "");
  if (stripLegacyHeader) {
    html = html.replace(/<div\s+class=['"]lgmp-header['"][\s\S]*?<\/div>/i, "");
  }
  if (stripTitle) {
    const titleText = game.i18n.localize(def.titleKey);
    const reTitle = new RegExp(`<h[12][^>]*>\\s*(?:\\d+\\.\\s*)?${escapeRegExp(titleText)}\\s*<\\/h[12]>`, "i");
    html = html.replace(reTitle, "");
  }
  if (stripDesc) {
    html = html.replace(/<p[^>]*class=['"]lgmp-step-desc['"][^>]*>[\s\S]*?<\/p>/i, "");
    const descText = game.i18n.localize(def.descKey);
    const reDesc = new RegExp(`<p[^>]*>\\s*${escapeRegExp(descText)}\\s*<\\/p>`, "i");
    html = html.replace(reDesc, "");
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
function nextSequenceNumber(prefix) {
  // enumerate using collection contents to avoid missing items
  const existing = (game.journal?.contents ?? []).filter(j => j.name?.startsWith(prefix));
  const nums = existing
    .map(j => j.name.match(/\b(\d+)\b/)?.[1] ?? null)
    .map(n => (n ? parseInt(n, 10) : 0));
  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}
function findPreviousSession(prefix) {
  const list = (game.journal?.contents ?? [])
    .filter(j => j.name?.startsWith(prefix))
    .map(j => {
      const n = j.name.match(/\b(\d+)\b/)?.[1] ?? null;
      return { num: n ? parseInt(n, 10) : 0, journal: j };
    })
    .filter(x => x.num > 0)
    .sort((a, b) => b.num - a.num);
  return list.length ? list[0].journal : null;
}
function getPreviousPageContent(prevJournal, def) {
  if (!prevJournal) return null;
  try {
    const wantedName = game.i18n.localize(def.titleKey);
    const page = prevJournal.pages.find(p => (p.name ?? "") === wantedName);
    if (page?.text?.content) return page.text.content;
  } catch (err) {
    console.warn(`${MODULE_ID} previous page fetch failed`, err);
  }
  return null;
}

/* ================================= string utils ================================= */
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
function escapeRegExp(s) {
  return String(s ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function stripTags(s) {
  return String(s ?? "").replace(/<\/?[^>]+>/g, "");
}
function splitMarker(line) {
  const trimmed = String(line ?? "").trim();
  if (/^☑\s*/.test(trimmed)) return { marker: "☑", text: trimmed.replace(/^☑\s*/, "") };
  if (/^☐\s*/.test(trimmed)) return { marker: "☐", text: trimmed.replace(/^☐\s*/, "") };
  if (/^\[\s*\[xX]\s*\]\s*/.test(trimmed)) return { marker: "☑", text: trimmed.replace(/^\[\s*\[xX]\s*\]\s*/, "") };
  if (/^\[\s*\]\s*/.test(trimmed)) return { marker: "☐", text: trimmed.replace(/^\[\s*\]\s*/, "") };
  return { marker: "", text: trimmed };
}

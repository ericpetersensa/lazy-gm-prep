// src/journal/generator.js
import { MODULE_ID, SETTINGS } from "../constants.js";
import { PAGE_ORDER, getSetting } from "../settings.js";

/**
 * Create a new GM Prep journal for the next session.
 * - Separate pages: disables "Display Page Title" so only the page header shows the title.
 * - Combined page: keeps H2 headers for each section.
 * - Scrubs legacy headers/descriptions from copied content.
 */
export async function createPrepJournal() {
  const separate   = !!getSetting(SETTINGS.separatePages, true);
  const folderName = getSetting(SETTINGS.folderName, "GM Prep");
  const prefix     = getSetting(SETTINGS.journalPrefix, "Session");
  const includeDate = !!getSetting("includeDateInName", true);

  const folder = await ensureFolder(folderName);
  const seq    = nextSequenceNumber(prefix);
  const entryName = includeDate
    ? `${prefix} ${seq}: ${new Date().toLocaleDateString()}`
    : `${prefix} ${seq}`;

  // Find previous session by the highest numeric suffix after the prefix (e.g., "Session 3: ...")
  const prev = findPreviousSession(prefix);

  if (separate) {
    // --- Separate pages: no in-body H2; description + notes if new; scrub copied content.
    const pages = [];
    for (const def of PAGE_ORDER) {
      const copyOn      = !!getSetting(`copy.${def.key}`, def.key !== "choose-monsters");
      const prevContent = copyOn ? getPreviousPageContent(prev, def) : null;

      let content;
      if (prevContent) {
        // Remove legacy headers so we don't show a duplicate "1. Review the Characters" inside the page body.
        content = scrubContent(prevContent, def, { stripTitle: true, stripLegacyHeader: true, stripDesc: false });
        if (!content.trim()) content = sectionDescription(def) + notesPlaceholder();
      } else {
        content = sectionDescription(def) + notesPlaceholder();
      }

      pages.push({
        name: game.i18n.localize(def.titleKey),
        type: "text",
        displayTitle: false, // <--- disables the in-body title!
        text: { format: 1, content }
      });
    }

    const entry = await JournalEntry.create({ name: entryName, folder, pages });
    ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
    return entry;
  }

  // --- Combined single-page mode: keep H2 headers for each section.
  const chunks = [];
  for (const def of PAGE_ORDER) {
    const copyOn      = !!getSetting(`copy.${def.key}`, def.key !== "choose-monsters");
    const prevContent = copyOn ? getPreviousPageContent(prev, def) : null;

    // Always render a clean header + description for combined mode.
    const headerHtml = sectionHeader(def) + sectionDescription(def);

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
    folder,
    pages: [{
      name: game.i18n.localize("lazy-gm-prep.module.name"),
      type: "text",
      text: { format: 1, content: chunks.join("\n<hr/>\n") }
    }]
  });

  ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
  return entry;
}

/* ------------------------------ section builders ------------------------------ */

function sectionHeader(def) {
  const title = game.i18n.localize(def.titleKey);
  return `<h2 style="margin:0">${escapeHtml(title)}</h2>\n`;
}

function sectionDescription(def) {
  const desc  = game.i18n.localize(def.descKey);
  return `<p class="lgmp-step-desc">${escapeHtml(desc)}</p>\n`;
}

function notesPlaceholder() {
  const hint  = game.i18n.localize("lazy-gm-prep.ui.add-notes-here") || "Add your notes here.";
  return `<p><em>${escapeHtml(hint)}</em></p>\n`;
}

/* ------------------------------ helpers ------------------------------ */

async function ensureFolder(name) {
  if (!name) return null;
  const existing = game.folders?.find(f => f.type === "JournalEntry" && f.name === name);
  if (existing) return existing.id;
  // Ensure the folder is created with the requested color
  const f = await Folder.create({ name, type: "JournalEntry", color: "#6d712d" });
  return f?.id ?? null;
}

function nextSequenceNumber(prefix) {
  const existing = game.journal?.filter(j => j.name?.startsWith(prefix)) ?? [];
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

/**
 * Fetch previous session's page by localized title.
 */
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

/**
 * Remove legacy in-body headers so we don't duplicate the page name, and (optionally) the
 * old auto-inserted description. Also drops the old .lgmp-header wrapper when found.
 */
function scrubContent(rawHtml, def, { stripTitle = true, stripLegacyHeader = true, stripDesc = false } = {}) {
  let html = String(rawHtml ?? "");

  // Remove legacy wrapper like: <div class="lgmp-header"> ... </div>
  if (stripLegacyHeader) {
    html = html.replace(/<div\s+class=["']lgmp-header["'][\s\S]*?<\/div>/i, "");
  }

  // Remove the first H1/H2 matching the section title (with optional leading "1. " etc.)
  if (stripTitle) {
    const titleText = game.i18n.localize(def.titleKey);
    const titlePattern = escapeRegExp(titleText);
    const re = new RegExp(`<h[12][^>]*>\\s*(?:\\d+\\.\\s*)?${titlePattern}\\s*<\\/h[12]>`, "i");
    html = html.replace(re, "");
  }

  // Optionally remove the auto description paragraph (either by class or exact text match).
  if (stripDesc) {
    const descText = game.i18n.localize(def.descKey);
    // By class (our recent markup)
    html = html.replace(/<p[^>]*class=["']lgmp-step-desc["'][^>]*>[\s\S]*?<\/p>/i, "");
    // As plain paragraph (older markup)
    const reDesc = new RegExp(`<p[^>]*>\\s*${escapeRegExp(descText)}\\s*<\\/p>`, "i");
    html = html.replace(reDesc, "");
  }

  return html.trim();
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function escapeRegExp(s) {
  return String(s ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

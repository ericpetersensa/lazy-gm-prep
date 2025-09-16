// src/journal/generator.js
import { MODULE_ID, SETTINGS } from "../constants.js";
import { PAGE_ORDER, getSetting } from "../settings.js";

/**
 * Create a new GM Prep journal for the next session.
 * - If a page's "Copy previous" toggle is enabled and a matching page exists in the previous session,
 *   copy that page's HTML; otherwise create a blank scaffold with numbered header + short description.
 * - Works best when the previous session used separate pages (no fragile HTML parsing).
 */
export async function createPrepJournal() {
  const separate = !!getSetting(SETTINGS.separatePages, true);
  const folderName = getSetting(SETTINGS.folderName, "GM Prep");
  const prefix = getSetting(SETTINGS.journalPrefix, "Session");
  const includeDate = !!getSetting("includeDateInName", true);

  const folder = await ensureFolder(folderName);
  const seq = nextSequenceNumber(prefix);
  const entryName = includeDate
    ? `${prefix} ${seq}: ${new Date().toLocaleDateString()}`
    : `${prefix} ${seq}`;

  // Find previous session by the highest numeric suffix after the prefix (e.g., "Session 3: ...")
  const prev = findPreviousSession(prefix);

  if (separate) {
    const pages = [];
    for (const def of PAGE_ORDER) {
      const copyOn = !!getSetting(`copy.${def.key}`, def.key !== "choose-monsters");
      const prevContent = copyOn ? getPreviousPageContent(prev, def) : null;
      const content = prevContent ?? composeSection(def);
      pages.push({
        name: game.i18n.localize(def.titleKey),
        type: "text",
        text: { format: 1, content }
      });
    }
    const entry = await JournalEntry.create({ name: entryName, folder, pages });
    ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
    return entry;
  }

  // Combined single-page mode: stitch all sections; copy where a prior separate page exists.
  const combined = PAGE_ORDER
    .map(def => {
      const copyOn = !!getSetting(`copy.${def.key}`, def.key !== "choose-monsters");
      const prevContent = copyOn ? getPreviousPageContent(prev, def) : null;
      return prevContent ?? composeSection(def);
    })
    .join("\n<hr/>\n");

  const entry = await JournalEntry.create({
    name: entryName,
    folder,
    pages: [{
      name: game.i18n.localize("lazy-gm-prep.module.name"),
      type: "text",
      text: { format: 1, content: combined }
    }]
  });

  ui.notifications?.info(game.i18n.format("lazy-gm-prep.notifications.created", { name: entry.name }));
  return entry;
}

/* ------------------------------ helpers ------------------------------ */

function composeSection(def) {
  const title = game.i18n.localize(def.titleKey);
  const desc  = game.i18n.localize(def.descKey);
  const hint  = game.i18n.localize("lazy-gm-prep.ui.add-notes-here");

  return `
  <section class="lgmp-section lgmp-${def.key}">
    <h2 style="margin:0">${escapeHtml(title)}</h2>
    <p class="lgmp-step-desc">${escapeHtml(desc)}</p>
    <p><em>${escapeHtml(hint)}</em></p>
  </section>
  `;
}

async function ensureFolder(name) {
  if (!name) return null;
  const existing = game.folders?.find(f => f.type === "JournalEntry" && f.name === name);
  if (existing) return existing.id;
  // Set color to #6d712d when creating the folder
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
 * Try to fetch the previous session's page content for the same numbered step.
 * We match by page name equal to the localized title (e.g., "1. Review the Characters").
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

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

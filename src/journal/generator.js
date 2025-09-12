// src/journal/generator.js

import { MODULE_ID, SETTINGS } from "../constants.js";
import { STEP_DEFS } from "../steps/index.js";

/** Basic HTML escaping for text content that will be injected into innerHTML. */
function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Returns local date as YYYY-MM-DD (e.g., 2025-09-11 in PST/PDT). */
function localISODate(d = new Date()) {
  const tz = d.getTimezoneOffset();                // minutes difference from UTC
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().split("T")[0];
}

/**
 * Ensure a JournalEntry folder exists (create if missing).
 */
async function getOrCreateFolder(name) {
  let folder = game.folders.find(f => f.name === name && f.type === "JournalEntry");
  if (!folder) {
    folder = await Folder.create({
      name,
      type: "JournalEntry",
      color: "#d9a066"
    });
  }
  return folder;
}

/**
 * Calculate the next session number by parsing existing journals.
 */
function getNextSessionNumber(folder, prefix) {
  const entries = game.journal.contents.filter(
    j => j.folder?.id === folder.id && j.name.startsWith(prefix)
  );
  const numbers = entries.map(e => {
    const m = e.name.match(new RegExp(`^${prefix}\\s+(\\d+)`, "i"));
    return m ? parseInt(m[1]) : 0;
  });
  return Math.max(0, ...numbers) + 1;
}

/**
 * Create a new prep journal with the configured pages.
 * (No actor placeholders; just the step headers + descriptions)
 */
export async function createPrepJournal() {
  const separatePages = game.settings.get(MODULE_ID, SETTINGS.separatePages);
  const folderName    = game.settings.get(MODULE_ID, SETTINGS.folderName);
  const journalPrefix = game.settings.get(MODULE_ID, SETTINGS.journalPrefix);

  const folder        = await getOrCreateFolder(folderName);
  const sessionNumber = getNextSessionNumber(folder, journalPrefix);
  const dateStamp     = localISODate();                            // Local (not UTC)
  const journalName   = `${journalPrefix} ${sessionNumber}: ${dateStamp}`;

  const pages = separatePages
    ? STEP_DEFS.map((step, idx) => {
        const content = `<p>${esc(step.description)}</p>`;
        return {
          name: step.numbered ? `${idx + 1}. ${esc(step.title)}` : esc(step.title),
          type: "text",
          sort: idx * 100,
          text: { format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML, content }
        };
      })
    : [{
        name: "Prep",
        type: "text",
        text: {
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
          content: STEP_DEFS.map((step, idx) => {
            const header = `<p><strong>${
              step.numbered ? `${idx + 1}. ` : ""
            }${esc(step.title)}</strong></p>`;
            const body   = `<p>${esc(step.description)}</p>`;
            return header + body + "<hr>";
          }).join("")
        }
      }];

  const journal = await JournalEntry.create({
    name:  journalName,
    folder: folder.id,
    flags:  { [MODULE_ID]: { sessionNumber } },
    pages
  });

  ui.journal.render(true);
  ui.notifications.info(
    game.i18n.format("lazy-gm-prep.notifications.created", { name: journal.name })
  );
  return journal;
}

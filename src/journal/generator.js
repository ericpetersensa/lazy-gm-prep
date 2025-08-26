// src/journal/generator.js

import { MODULE_ID, SETTINGS } from "../constants.js";
import { STEP_DEFS } from "../steps/index.js";

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
 * Build the actor‐rows HTML for the “Review the Characters” step.
 */
function getActorRowsHTML() {
  const actors = game.actors.contents.filter(a => a.isOwner);
  if (!actors.length) return `<p><em>No actors available</em></p>`;

  return actors.map(actor => {
    const seen = actor.getFlag(MODULE_ID, "lastSeen") || "";
    const spot = actor.getFlag(MODULE_ID, "lastSpotlight") || "";
    return `
      <div class="lazy-gm-actor-row" data-actor-id="${actor.id}">
        <div style="display:flex;align-items:center;gap:0.5em;">
          <img src="${actor.img}" title="${actor.name}"
               width="36" height="36"
               style="border:1px solid var(--color-border-light-primary);border-radius:4px;">
          <a href="#" class="lazy-gm-open-sheet" data-actor-id="${actor.id}">
            ${actor.name}
          </a>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:0.5em;margin-top:0.5em;">
          <label style="min-width:8ch;">Last Seen</label>
          <input type="date" class="lazy-gm-date"
                 data-actor-id="${actor.id}" data-field="lastSeen"
                 value="${seen}">
          <button type="button" class="lazy-gm-today"
                  data-actor-id="${actor.id}" data-field="lastSeen">
            Today
          </button>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:0.5em;margin-top:0.25em;">
          <label style="min-width:8ch;">Last Spotlight</label>
          <input type="date" class="lazy-gm-date"
                 data-actor-id="${actor.id}" data-field="lastSpotlight"
                 value="${spot}">
          <button type="button" class="lazy-gm-today"
                  data-actor-id="${actor.id}" data-field="lastSpotlight">
            Today
          </button>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Create a new prep journal with the configured pages.
 */
export async function createPrepJournal() {
  const separatePages = game.settings.get(MODULE_ID, SETTINGS.separatePages);
  const folderName    = game.settings.get(MODULE_ID, SETTINGS.folderName);
  const journalPrefix = game.settings.get(MODULE_ID, SETTINGS.journalPrefix);

  const folder        = await getOrCreateFolder(folderName);
  const sessionNumber = getNextSessionNumber(folder, journalPrefix);
  const dateStamp     = new Date().toISOString().split("T")[0];
  const journalName   = `${journalPrefix} ${sessionNumber} - ${dateStamp}`;

  const pages = separatePages
    ? STEP_DEFS.map((step, idx) => {
        let content = `<p>${step.description}</p>`;
        if (idx === 0) content += `<div class="lazy-gm-actors">${getActorRowsHTML()}</div>`;
        return {
          name: step.numbered ? `${idx + 1}. ${step.title}` : step.title,
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
            const header = `<p><strong>${step.numbered ? `${idx + 1}. ` : ""}${step.title}</strong></p>`;
            let body = `<p>${step.description}</p>`;
            if (idx === 0) body += `<div class="lazy-gm-actors">${getActorRowsHTML()}</div>`;
            return header + body + "<hr>";
          }).join("")
        }
      }];

  const journal = await JournalEntry.create({
    name: journalName,
    folder: folder.id,
    flags: { [MODULE_ID]: { sessionNumber } },
    pages
  });

  ui.journal.render(true);
  ui.notifications.info(`Created: ${journal.name}`);
}

import { STEP_DEFS } from "../steps/index.js";

export async function createPrepJournal() {
  const separatePages = game.settings.get("lazy-gm-prep", "separatePages");

  // Determine session number by counting existing
  const existing = game.journal.filter(j => j.name.startsWith("Session "));
  const sessionNum = existing.length + 1;

  const dateStamp = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "2-digit", day: "2-digit"
  });

  const name = `Session ${sessionNum} – ${dateStamp}`;

  // Folder for prep journals
  let folder = game.folders.find(f => f.name === "Lazy GM Prep" && f.type === "JournalEntry");
  if (!folder) {
    folder = await Folder.create({ name: "Lazy GM Prep", type: "JournalEntry", color: "#d9a066" });
  }

  let pages = [];
  if (separatePages) {
    pages = STEP_DEFS.map((step, idx) => ({
      name: step.numbered ? `${idx + 1}. ${step.title}` : step.title,
      type: "text",
      text: {
        format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
        content: `<p>${step.description}</p><div class="lazygm-placeholder" data-step-index="${idx}"></div>`
      },
      sort: idx * 100
    }));
  } else {
    const combined = STEP_DEFS.map((step, idx) => {
      const prefix = step.numbered ? `<strong>${idx + 1}. ${step.title}</strong>` : `<strong>${step.title}</strong>`;
      return `<p>${prefix}</p><p>${step.description}</p><div class="lazygm-placeholder" data-step-index="${idx}"></div>`;
    }).join("<hr>");
    pages = [{
      name: "Prep",
      type: "text",
      text: { format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML, content: combined }
    }];
  }

  const journal = await JournalEntry.create({ name, folder: folder.id, pages });
  ui.journal.render();
  ui.notifications.info(`Created: ${journal.name}`);
}

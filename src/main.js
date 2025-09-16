// src/main.js
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

/* ------------------------------------------------------------------ */
/* Create GM Prep: Header button (AppV2 & v13+)                       */
/* ------------------------------------------------------------------ */
function ensureInlineHeaderButton(rootEl) {
  if (!game.user.isGM) return;
  const header = rootEl.querySelector(".directory-header");
  if (!header) return;

  const container =
    header.querySelector(".action-buttons") ||
    header.querySelector(".header-actions") ||
    header.querySelector(".header-controls") ||
    header;

  if (container.querySelector('[data-action="lazy-gm-prep-inline"]')) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.action = "lazy-gm-prep-inline";
  btn.classList.add("lazy-gm-prep-btn", "header-control", "create-entry");
  btn.title = game.i18n.localize("lazy-gm-prep.header.buttonTooltip");
  btn.innerHTML = `<i class="fa-solid fa-clipboard-list"></i> ${game.i18n.localize("lazy-gm-prep.header.button")}`;
  btn.addEventListener("click", () => createPrepJournal());
  container.appendChild(btn);
}

Hooks.on("renderJournalDirectory", (_app, html) => {
  const root = html?.[0] ?? html;
  if (root) ensureInlineHeaderButton(root);
});

/* ------------------------------------------------------------------ */
/* Checklist: View-mode toggle (☐ ⇄ ☑) with immediate persistence     */
/* ------------------------------------------------------------------ */
/**
 * Attaches at render time to the page’s container in *view* mode.
 * We don’t trust app.options.editable; instead we inspect the DOM to detect editors.
 * On click:
 *   - Toggle the leading marker (☐/☑) on the clicked <li>
 *   - Persist by replacing the <ul.lgmp-checklist> block inside the saved page HTML
 *   - Re-render the page
 */
Hooks.on("renderJournalPageSheet", (app, html) => {
  const container = html?.[0] ?? html;
  if (!container) return;

  // If the page is in edit mode, TinyMCE/ProseMirror is present; skip binding in that case.
  const isEditMode =
    container.querySelector(".editor") ||
    container.querySelector(".tox-tinymce") ||
    container.querySelector('[contenteditable="true"]');
  if (isEditMode) return;

  // Delegate click handling to the page container (works for dynamic lists too)
  const onClick = async (ev) => {
    const li = ev.target?.closest(".lgmp-checklist li");
    if (!li) return;

    // Toggle the leading marker
    const currentText = li.textContent ?? "";
    let nextText = currentText;
    if (/^\s*☐/.test(currentText))      nextText = currentText.replace(/^\s*☐/, "☑");
    else if (/^\s*☑/.test(currentText)) nextText = currentText.replace(/^\s*☑/, "☐");
    else if (/^\s*\[\s*\]/.test(currentText))       nextText = currentText.replace(/^\s*\[\s*\]/, "☑");
    else if (/^\s*\[\s*[xX]\s*\]/.test(currentText)) nextText = currentText.replace(/^\s*\[\s*[xX]\s*\]/, "☐");
    else nextText = `☐ ${currentText}`;

    // Update the display immediately
    li.textContent = nextText;

    // Persist: replace the matching <ul.lgmp-checklist> inside the saved Document
    try {
      const page = app?.page; // JournalEntryPage
      if (!page) return;

      const ulEl = li.closest("ul.lgmp-checklist");
      if (!ulEl) return;

      // Build new UL HTML from the live DOM
      const newULHtml = ulEl.outerHTML;

      // Parse current saved content to robustly replace the checklist UL
      const oldContent = page.text?.content ?? "";
      const parser = new DOMParser();
      const doc = parser.parseFromString(oldContent, "text/html");
      const savedUL = doc.querySelector("ul.lgmp-checklist");

      let newContent;
      if (savedUL) {
        // Replace the saved UL with the live UL
        savedUL.outerHTML = newULHtml;
        newContent = doc.body.innerHTML;
      } else {
        // Unexpected: no UL found in saved content; append it to the end to avoid data loss
        newContent = `${oldContent}\n${newULHtml}`;
      }

      await page.update({ "text.content": newContent });
      app.render(true);
    } catch (err) {
      console.error(`${MODULE_ID} | Checklist toggle persist failed:`, err);
    }
  };

  // Ensure we don’t double-bind if the sheet re-renders
  container.removeEventListener("click", onClick, false);
  container.addEventListener("click", onClick, false);
});

/* ------------------------------------------------------------------ */
/* Module init / ready / commands / keybindings                       */
/* ------------------------------------------------------------------ */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();

  // Keybinding: Alt+P (GM) -> Create Prep journal
  game.keybindings.register(MODULE_ID, "create-prep", {
    name: "lazy-gm-prep.keybindings.createPrep.name",
    hint: "lazy-gm-prep.keybindings.createPrep.hint",
    editable: [{ key: "KeyP", modifiers: ["Alt"] }],
    onDown: () => {
      if (!game.user.isGM) return false;
      createPrepJournal();
      return true;
    },
    restricted: true
  });
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
  ui.journal?.render(true);
});

// Chat command: /prep -> Create Prep (GM only)
Hooks.on("chatMessage", (_chatLog, text) => {
  if (!game.user.isGM) return;
  if (text.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false;
  }
});

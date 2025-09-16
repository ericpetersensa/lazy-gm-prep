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
 * AppV2 renders journal pages inside custom elements (e.g. <journal-page-text>)
 * which use a Shadow DOM. We must bind clicks in BOTH the light DOM and the
 * component's shadowRoot to see clicks on <ul.lgmp-checklist> items.
 */
Hooks.on("renderJournalPageSheet", (app, html) => {
  const container = html?.[0] ?? html;
  if (!container) return;

  // Detect edit mode by presence of editors; only toggle in VIEW mode.
  const isEditMode =
    container.querySelector(".editor") ||
    container.querySelector(".tox-tinymce") ||
    container.querySelector('[contenteditable="true"]');
  if (isEditMode) return;

  // Collect roots to listen on: light DOM AND the shadowRoot of known page components.
  const roots = new Set();
  roots.add(container);

  // Text pages
  const textHost = container.querySelector("journal-page-text");
  if (textHost?.shadowRoot) roots.add(textHost.shadowRoot);

  // (Optional) other page types that might host checklists in the future:
  const htmlHost = container.querySelector("journal-page-html");
  if (htmlHost?.shadowRoot) roots.add(htmlHost.shadowRoot);

  // Robust delegated click handler
  const handler = async (ev) => {
    // Find clicked LI within a checklist
    const li = ev.composedPath
      ? ev.composedPath().find((n) => n?.nodeType === 1 && n.matches?.(".lgmp-checklist li"))
      : ev.target?.closest?.(".lgmp-checklist li");

    if (!li) return;

    // Toggle the leading marker in the *text content* of the LI
    const current = li.textContent ?? "";
    let next = current;
    if (/^\s*☐/.test(current))      next = current.replace(/^\s*☐/, "☑");
    else if (/^\s*☑/.test(current)) next = current.replace(/^\s*☑/, "☐");
    else if (/^\s*\[\s*\]/.test(current))       next = current.replace(/^\s*\[\s*\]/, "☑");
    else if (/^\s*\[\s*[xX]\s*\]/.test(current)) next = current.replace(/^\s*\[\s*[xX]\s*\]/, "☐");
    else next = `☐ ${current}`;

    // Update view immediately
    li.textContent = next;

    // Persist: replace the current <ul.lgmp-checklist> in the saved page HTML.
    try {
      const page = app?.page; // JournalEntryPage document
      if (!page) return;

      const ulEl = li.closest?.("ul.lgmp-checklist");
      if (!ulEl) return;

      const newUL = ulEl.outerHTML;
      const oldContent = page.text?.content ?? "";

      // Parse saved HTML; replace the first lgmp-checklist UL found.
      const parser = new DOMParser();
      const doc = parser.parseFromString(oldContent, "text/html");
      const savedUL = doc.querySelector("ul.lgmp-checklist");

      let newContent;
      if (savedUL) {
        savedUL.outerHTML = newUL;
        newContent = doc.body.innerHTML;
      } else {
        // Safety: append if somehow missing in saved content
        newContent = `${oldContent}\n${newUL}`;
      }

      await page.update({ "text.content": newContent });
      app.render(true);
    } catch (err) {
      console.error(`${MODULE_ID} | Checklist toggle persist failed:`, err);
    }
  };

  // Bind once per root; guard against double-binding by removing then adding.
  for (const root of roots) {
    root.removeEventListener("click", handler, true);
    root.addEventListener("click", handler, true);
  }
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

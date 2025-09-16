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
 * AppV2 uses Shadow DOM inside page components. We can't rely on querying a
 * specific host (e.g., <journal-page-text>). Instead:
 *  - Attach a CAPTURING click listener to the page sheet container AND to document.
 *  - On click, use event.composedPath() to locate the <li> that belongs to a
 *    <ul class="lgmp-checklist">, regardless of shadow boundaries.
 *  - Toggle the marker and persist by replacing the checklist UL in saved HTML.
 */
Hooks.on("renderJournalPageSheet", (app, html) => {
  const container = html?.[0] ?? html;
  if (!container) return;

  // Only toggle in view mode: if an editor is present, skip binding here.
  const isEditMode =
    container.querySelector(".editor") ||
    container.querySelector(".tox-tinymce") ||
    container.querySelector('[contenteditable="true"]');
  if (isEditMode) return;

  // --- Helper: find the clicked <li> from a composed click event
  function findChecklistLI(ev) {
    const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
    // Prefer composed path (crosses shadow). Fallback to target.closest.
    if (path.length) {
      for (const n of path) {
        if (n && n.nodeType === 1 && n.matches && n.matches("li")) {
          // Ensure its ancestor in the composed path is a UL.lgmp-checklist
          // Look forward in the path to find the UL that contains this LI
          const idx = path.indexOf(n);
          for (let i = idx; i < path.length; i++) {
            const p = path[i];
            if (p && p.nodeType === 1 && p.matches && p.matches("ul.lgmp-checklist")) {
              return n;
            }
          }
        }
      }
    }
    // Fallback for non-composed environments
    return ev.target?.closest?.(".lgmp-checklist li") ?? null;
  }

  async function handleClick(ev) {
    const li = findChecklistLI(ev);
    if (!li) return;

    // Toggle the leading box in *text content*
    const current = li.textContent ?? "";
    let next = current;
    if (/^\s*☐/.test(current)) next = current.replace(/^\s*☐/, "☑");
    else if (/^\s*☑/.test(current)) next = current.replace(/^\s*☑/, "☐");
    else if (/^\s*\[\s*\]/.test(current)) next = current.replace(/^\s*\[\s*\]/, "☑");
    else if (/^\s*\[\s*[xX]\s*\]/.test(current)) next = current.replace(/^\s*\[\s*[xX]\s*\]/, "☐");
    else next = `☐ ${current}`;

    // Update the live view immediately
    li.textContent = next;

    // Persist: replace the first <ul.lgmp-checklist> in the saved content
    try {
      const page = app?.page; // JournalEntryPage
      if (!page) return;

      // Find the UL element for outerHTML capture. Try composedPath again to get the real DOM node.
      let ulEl = null;
      if (typeof ev.composedPath === "function") {
        const path = ev.composedPath();
        ulEl = path.find((n) => n?.nodeType === 1 && n.matches?.("ul.lgmp-checklist")) ?? null;
      }
      if (!ulEl) ulEl = li.closest("ul.lgmp-checklist");
      if (!ulEl) return;

      const newUL = ulEl.outerHTML;
      const oldContent = page.text?.content ?? "";

      const parser = new DOMParser();
      const doc = parser.parseFromString(oldContent, "text/html");
      const savedUL = doc.querySelector("ul.lgmp-checklist");

      let newContent;
      if (savedUL) {
        savedUL.outerHTML = newUL;
        newContent = doc.body.innerHTML;
      } else {
        // If not found (unexpected), append for safety
        newContent = `${oldContent}\n${newUL}`;
      }

      await page.update({ "text.content": newContent });
      // Force a re-render so hover/tap stays consistent
      app.render(true);
    } catch (err) {
      console.error(`${MODULE_ID} | Checklist toggle persist failed:`, err);
    }
  }

  // Bind on the sheet container (capture) so we get composed events
  container.removeEventListener("click", handleClick, true);
  container.addEventListener("click", handleClick, true);

  // Also bind on document (capture) as a safety net for deeply nested shadow roots
  document.removeEventListener("click", handleClick, true);
  document.addEventListener("click", handleClick, true);
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

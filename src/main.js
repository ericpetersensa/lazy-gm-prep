// src/main.js
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

/* ------------------------------------------------------------------ */
/* Create GM Prep: Header button (AppV2 & v13+)                       */
/* ------------------------------------------------------------------ */
function ensureInlineHeaderButton(dirEl) {
  if (!game.user.isGM) return;
  const header = dirEl.querySelector(".directory-header");
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
  // html may be a jQuery-wrapped element in AppV2
  const root = html?.[0] ?? html;
  if (root) ensureInlineHeaderButton(root);
});

/* ------------------------------------------------------------------ */
/* Checklist: View-mode toggle with immediate persistence              */
/* ------------------------------------------------------------------ */
/**
 * We attach in VIEW mode only (not edit mode), so a GM can click a Secrets & Clues
 * checklist line to toggle ☐/☑ while running the session.
 *
 * After toggling, we immediately update the page's HTML:
 * - Locate the <ul.lgmp-checklist> that contains the clicked <li>
 * - Replace that UL's outerHTML in the Document's saved content
 * - Call page.update({ "text.content": ... }) to persist
 */
Hooks.on("renderJournalPageSheet", (app, html) => {
  // Only in view mode; in edit-mode TinyMCE consumes events and we don't want to mutate live editor DOM
  if (app?.options?.editable) return;

  // Attach a delegated handler to the checklist items
  html.find(".lgmp-checklist li").on("click", async function () {
    const $li = $(this);
    const current = $li.text() || "";
    let next = current;

    // Toggle Unicode checkboxes at the *start* of the line
    if (/^\s*☐/.test(current)) {
      next = current.replace(/^\s*☐/, "☑");
    } else if (/^\s*☑/.test(current)) {
      next = current.replace(/^\s*☑/, "☐");
    } else if (/^\s*\[\s*\]/.test(current)) {
      // Legacy [ ] -> ☑
      next = current.replace(/^\s*\[\s*\]/, "☑");
    } else if (/^\s*\[\s*[xX]\s*\]/.test(current)) {
      // Legacy [x] -> ☐
      next = current.replace(/^\s*\[\s*[xX]\s*\]/, "☐");
    } else {
      // No marker; prepend an unchecked box
      next = `☐ ${current}`;
    }

    // Write the new text back
    $li.text(next);

    // Persist change by replacing the UL's HTML inside the page's saved content
    try {
      const page = app?.page; // JournalEntryPage document
      if (!page) return;

      const ulEl = $li.closest("ul.lgmp-checklist")?.get(0);
      if (!ulEl) return;

      // Use the *rendered* UL HTML as the new block to persist
      const newUL = ulEl.outerHTML;

      // The original content as saved (string)
      const oldContent = page.text?.content ?? "";

      // We need to find the current UL block in oldContent; safest is to query the snapshot of the rendered HTML for that UL
      // Use the first matching lgmp-checklist in the *saved* content; replace that one.
      // (Secrets & Clues has a single checklist block by design.)
      const UL_RE = /<ul\s+class=["']lgmp-checklist["'][\s\S]*?<\/ul>/i;
      const hasChecklist = UL_RE.test(oldContent);

      let newContent;
      if (hasChecklist) {
        newContent = oldContent.replace(UL_RE, newUL);
      } else {
        // If the saved content is missing the UL (unexpected), append it at the end to avoid data loss
        newContent = `${oldContent}\n${newUL}`;
      }

      // Persist
      await page.update({ "text.content": newContent });

      // Optional: force re-render so hover/click targets remain consistent
      app.render(true);
    } catch (err) {
      console.error(`${MODULE_ID} | Failed to persist checklist toggle:`, err);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Module init / ready / commands / keybindings                       */
/* ------------------------------------------------------------------ */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();

  // Keybinding: Alt+P (GM) -> Create Prep
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
  // Ensure directory reflects newly injected header control
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

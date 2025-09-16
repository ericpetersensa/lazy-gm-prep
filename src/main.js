// src/main.js
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

// --- Add a visible "Create GM Prep" button to the Journal Directory header (AppV2 & v13+) ---

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
  ensureInlineHeaderButton(html[0] ?? html);
});

// --- Toggle ☐ / ☑ (and support legacy [ ] / [x]) on click within checklist --------
// Works in view or edit mode; remember to Save the journal to persist.
Hooks.on("renderJournalPageSheet", (_app, html) => {
  html.on("click", ".lgmp-checklist li", (ev) => {
    const li = ev.currentTarget;
    const text = li.textContent || "";
    let newText = text;

    // Unicode boxes first
    if (/^\s*☐/.test(text)) {
      newText = text.replace(/^\s*☐/, "☑");
    } else if (/^\s*☑/.test(text)) {
      newText = text.replace(/^\s*☑/, "☐");
    }
    // Legacy bracket fallback (normalize to Unicode)
    else if (/^\s*\[\s*\]/.test(text)) {
      newText = text.replace(/^\s*\[\s*\]/, "☑");
    } else if (/^\s*\[\s*[xX]\s*\]/.test(text)) {
      newText = text.replace(/^\s*\[\s*[xX]\s*\]/, "☐");
    } else {
      // No marker at start: prepend an unchecked box
      newText = `☐ ${text}`;
    }

    // Keep any inline HTML (e.g., italics in clue text) by only replacing the leading marker in innerHTML too
    // Simple approach: set plainText back; if you want richer preservation, we can do a range replace.
    li.innerText = newText;
  });
});

// --- Standard module setup and triggers ---

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();

  // Keybinding: Alt+P (GM only)
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

// Chat command: /prep
Hooks.on("chatMessage", (_chatLog, text) => {
  if (!game.user.isGM) return;
  if (text.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false;
  }
});

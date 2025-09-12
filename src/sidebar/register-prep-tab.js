// src/sidebar/register-prep-tab.js

import { MODULE_ID } from "../constants.js";
import { createPrepJournal } from "../journal/generator.js";

const ACTION_ID = "lazy-gm-prep__new-prep";

/* ---------------------------
 * 1) Header-menu control (AppV2)
 * --------------------------- */
function addNewPrepMenuControl(controls) {
  if (!game.user.isGM) return;
  if (Array.isArray(controls) && controls.some(c => c?.action === ACTION_ID)) return;

  controls.unshift({
    action: ACTION_ID,
    icon: "fa-solid fa-clipboard-list",
    label: game.i18n.localize("lazy-gm-prep.header.button"),
    onClick: () => createPrepJournal()
  });
}

// Register for class-specific + generic hooks to cover all builds
[
  "getHeaderControlsJournalDirectory",
  "getHeaderControlsDocumentDirectory",
  "getHeaderControlsAbstractSidebarTab",
  "getHeaderControlsApplicationV2"
].forEach(hookName => {
  Hooks.on(hookName, (app, controls) => {
    try {
      if (hookName === "getHeaderControlsApplicationV2") {
        const name = app?.constructor?.name;
        if (!["JournalDirectory", "DocumentDirectory", "AbstractSidebarTab"].includes(name)) return;
      }
      addNewPrepMenuControl(controls);
    } catch (err) {
      console.error(`${MODULE_ID} | Failed to add header control via ${hookName}:`, err);
    }
  });
});

/* ---------------------------
 * 2) Visible inline button in the Journal Directory header
 * --------------------------- */
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
  // Reuse core button look for perfect theme parity
  btn.classList.add("lazy-gm-prep-btn", "header-control", "create-entry");
  btn.title = game.i18n.localize("lazy-gm-prep.header.button");
  btn.innerHTML = `<i class="fa-solid fa-clipboard-list"></i> ${game.i18n.localize("lazy-gm-prep.header.button")}`;

  btn.addEventListener("click", () => createPrepJournal());
  container.appendChild(btn);
}

// Inject the inline button on every render
Hooks.on("renderJournalDirectory", (app, element) => {
  ensureInlineHeaderButton(element);
});

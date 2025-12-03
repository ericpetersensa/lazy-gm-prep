
// src/journal/domHooks.js
import { MODULE_ID } from '../constants.js';

/**
 * Injects small CSS tweaks for click affordance (already present).
 */
export function ensureClickCSS() {
  if (document.getElementById(`${MODULE_ID}-toggle-style`)) return;
  const style = document.createElement("style");
  style.id = `${MODULE_ID}-toggle-style`;
  style.textContent = `
    ul.lgmp-checklist li { cursor: pointer; user-select: none; }
    ul.lgmp-checklist li:active { opacity: .85; }
  `;
  document.head.appendChild(style);
}

/**
 * Enables ☑/☐ checklist toggling in VIEW mode for both:
 * - Secrets & Clues lists (ul.lgmp-checklist)
 * - Scene cards (div.lgmp-scene ul.lgmp-checklist)
 *
 * Notes:
 *  - In EDIT mode, Foundry renders raw HTML/Markdown; users can still edit the symbol manually.
 *  - This handler only changes the displayed symbol; carry-over logic should parse
 *    the symbol (☐ vs ☑) from the persisted journal content.
 */
export function enableChecklistToggle() {
  // Event delegation: one listener for the whole document
  document.addEventListener("click", (e) => {
    const target = e.target;

    // Only act on <li> inside a .lgmp-checklist
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches("ul.lgmp-checklist li")) return;

    const text = target.textContent?.trim() ?? "";
    if (text.startsWith("☐")) {
      target.textContent = text.replace(/^☐/, "☑");
    } else if (text.startsWith("☑")) {
      target.textContent = text.replace(/^☑/, "☐");
    }
  });
}

/**
 * Call this once when the module starts.
 */
export function initDomHooks() {
  ensureClickCSS();
  enableChecklistToggle();
}

// Foundry startup hook
Hooks.on("ready", () => {
  initDomHooks();
});


// src/journal/domHooks.js

import { MODULE_ID } from '../constants.js';

/**
 * Lightweight CSS to keep checklist items feeling interactive.
 * NOTE: No click handlers here—main.js owns toggling for both Clues and Scenes.
 */
export function ensureClickCSS() {
  if (document.getElementById(`${MODULE_ID}-toggle-style`)) return;

  const style = document.createElement("style");
  style.id = `${MODULE_ID}-toggle-style`;
  style.textContent = `
    /* Checklist visual affordance only; behavior comes from main.js */
    ul.lgmp-checklist li {
      cursor: pointer;
      user-select: none;
    }
    ul.lgmp-checklist li:active {
      opacity: .85;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize minimal DOM hooks.
 * - No custom toggle logic.
 * - Styling only; main.js attaches behavior listeners.
 */
export function initDomHooks() {
  ensureClickCSS();
}

// Initialize once
Hooks.on("ready", () => {
  initDomHooks();
});

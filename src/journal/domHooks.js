
// src/journal/domHooks.js

import { MODULE_ID } from '../constants.js';

/**
 * Visual affordances only; actual checklist toggling is owned by main.js.
 */
export function ensureClickCSS() {
  if (document.getElementById(`${MODULE_ID}-toggle-style`)) return;

  const style = document.createElement('style');
  style.id = `${MODULE_ID}-toggle-style`;
  style.textContent = `
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
 * Minimal DOM hooks—no checklist logic here.
 */
export function initDomHooks() {
  ensureClickCSS();
}

// Guard in case Hooks is undefined during build or wrong load order.
if (typeof Hooks !== 'undefined' && Hooks?.on) {
  Hooks.on('ready', () => {
    initDomHooks();
  });
}

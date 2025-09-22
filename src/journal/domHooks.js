// src/journal/domHooks.js

export function ensureClickCSS(MODULE_ID) {
  if (document.getElementById(`${MODULE_ID}-toggle-style`)) return;
  const style = document.createElement("style");
  style.id = `${MODULE_ID}-toggle-style`;
  style.textContent = `
    ul.lgmp-checklist li { cursor: pointer; user-select: none; }
    ul.lgmp-checklist li:active { opacity: .85; }
  `;
  document.head.appendChild(style);
}

// Add other DOM-related hooks and helpers as needed from your original generator.js

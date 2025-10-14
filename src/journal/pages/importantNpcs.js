// src/journal/pages/importantNpcs.js

import {
  sectionDescription,
  notesPlaceholder,
  importantNpcsTableHTML,
  renderPromptsBlock
} from '../helpers.js';

/**
 * Creates the "6. Outline Important NPCs" journal page,
 * now including a Prompts block with four custom questions.
 *
 * @param {object} def - Section definition (with titleKey, descKey, etc.)
 * @param {string|null} prevContent - Previous session content (if copying)
 * @param {number} initialRows - Default number of NPC table rows
 * @returns {object} - Journal page object for Foundry VTT
 */
export function createImportantNpcsPage(def, prevContent, initialRows = 5) {
  // i18n keys for the custom prompts
  const promptKeys = [
    "lazy-gm-prep.npcs.prompts.connection",
    "lazy-gm-prep.npcs.prompts.goal",
    "lazy-gm-prep.npcs.prompts.trait",
    "lazy-gm-prep.npcs.prompts.surprise"
  ];

  let content;
  if (prevContent && prevContent.trim()) {
    // If previous content exists and is non-empty, use it as-is
    content = prevContent;
  } else {
    // Otherwise, build the page with section description, prompts, table, and notes
    content =
      sectionDescription(def) +
      renderPromptsBlock(promptKeys) +
      importantNpcsTableHTML(initialRows) +
      notesPlaceholder();
  }

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}

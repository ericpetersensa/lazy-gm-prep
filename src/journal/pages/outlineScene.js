
// src/journal/pages/outlineScene.js
import { escapeHtml, renderPromptsBlock, buildScenesHTML } from '../helpers.js';

/**
 * Outline Potential Scenes page (v13 JournalEntryPage object).
 * @param {object} def - Section definition (includes titleKey, key, etc.)
 * @param {string|null} prevContent - HTML carried forward from prior session, if any
 * @returns {import("types").JournalEntryPage} A page object with text content (HTML)
 */
export function createOutlineScenesPage(def, prevContent) {
  // Localized title (used both in header and page name)
  const title = game.i18n.localize(def.titleKey);

  // Localized description
  const desc = game.i18n.localize("lazy-gm-prep.steps.outline-scenes.description");

  // Build HTML content
  let html = `
    <h2 class="lgmp-section-title">${escapeHtml(title)}</h2>
    <p class="lgmp-section-desc">${escapeHtml(desc)}</p>
  `;

  // Prompts (collapsed by default)
  const promptKeys = [
    "lazy-gm-prep.outline-scenes.prompts.1",
    "lazy-gm-prep.outline-scenes.prompts.2",
    "lazy-gm-prep.outline-scenes.prompts.3",
    "lazy-gm-prep.outline-scenes.prompts.4"
  ];
  html += renderPromptsBlock(promptKeys, "lazy-gm-prep.prompts.heading", false);

  // Scenes section (open by default)
  const scenesHeading = game.i18n.localize("lazy-gm-prep.outline-scenes.heading") || "Scenes";
  html += `
    <h2 class="lgmp-section-title">${escapeHtml(scenesHeading)}</h2>
    ${buildScenesHTML(prevContent, 3)}
  `;

  // v13: return a proper JournalEntryPage object (NOT a raw HTML string)
  return {
    name: title,
    type: "text",
    text: {
      content: html,
      format: CONST.TEXT_FORMAT_HTML
    },
    // Optional ordering hint so it sits roughly mid-stack
    sort: 500
  };
}

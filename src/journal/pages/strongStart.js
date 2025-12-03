
// src/journal/pages/strongStart.js

import {
  sectionDescription,
  notesPlaceholder,
  renderDetailsBlock,
  gmReviewPromptsHTML,
  quickCheckHTML
} from '../helpers.js';

export function createStrongStartPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // If copying previous content, use it directly—no template needed
  if (prevContent && String(prevContent).trim()) {
    return { name: title, type: 'text', text: { format: 1, content: prevContent } };
  }

  // SECTION: Prompts (+ Lazy Tip) — collapsed by default
  const promptsAndTipHTML = gmReviewPromptsHTML() + quickCheckHTML();

  // SECTION: Strong Start Card — open by default
  // Updated to use .lgmp-strong-start-card for consistent styling
  const strongStartCard = `
    <div class="lgmp-strong-start-card">
      <h5>${game.i18n.localize('lazy-gm-prep.strong-start.card.title') || 'Strong Start'}</h5>
      <div class="lgmp-field">
        <strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.whatsHappening') || "What's Happening?"}</strong>
        <div class="lgmp-card-fill">(Describe the event or change that kicks off the session)</div>
      </div>
      <div class="lgmp-field">
        <strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.point') || "What's the Point?"}</strong>
        <div class="lgmp-card-fill">(What hook or goal does this introduce?)</div>
      </div>
      <div class="lgmp-field">
        <strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.action') || "Where's the Action?"}</strong>
        <div class="lgmp-card-fill">(Describe the immediate action or conflict)</div>
      </div>
      <div class="lgmp-field">
        <strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.sensory') || "Sensory Details"}</strong>
        <div class="lgmp-card-fill">(Optional: sights, sounds, smells, etc.)</div>
      </div>
      <div class="lgmp-field">
        <strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.notes') || "Loose Notes"}</strong>
        <div class="lgmp-card-fill">(Any other GM notes)</div>
      </div>
    </div>
  `;

  let html = "";
  html += sectionDescription(def);

  // Prompts section (collapsed by default)
  html += renderDetailsBlock(
    "lazy-gm-prep.prompts.heading", // e.g., "Prompts"
    promptsAndTipHTML,
    false, // collapsed by default
    "lgmp-prompts-block"
  );

  // Strong Start card section (open by default)
  html += renderDetailsBlock(
    "lazy-gm-prep.strong-start.card.heading", // e.g., "Strong Start"
    strongStartCard,
    true, // open by default
    "lgmp-strong-start-block"
  );

  // Notes section (collapsed by default)
  html += renderDetailsBlock(
    "lazy-gm-prep.steps.other-notes.title", // e.g., "Other Notes"
    notesPlaceholder(),
    false, // collapsed by default
    "lgmp-notes-block"
  );

  return { name: title, type: 'text', text: { format: 1, content: html } };
}

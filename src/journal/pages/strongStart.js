
// src/journal/pages/strongStart.js

import { sectionDescription, notesPlaceholder, renderDetailsBlock } from '../helpers.js';

export function createStrongStartPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // If copying previous content, use it directly—no template needed
  if (prevContent && String(prevContent).trim()) {
    return { name: title, type: 'text', text: { format: 1, content: prevContent } };
  }

  // Build the Strong Start card
  const strongStartCard = `
  <div class="lgmp-scene lgmp-strong-start-card">
    <h5>${game.i18n.localize('lazy-gm-prep.strong-start.card.title') || 'Strong Start'}</h5>
    <div class="lgmp-field"><strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.whatsHappening') || "What's Happening?"}</strong><br>
      <em>(Describe the event or change that kicks off the session)</em>
      <div class="lgmp-card-fill"></div>
    </div>
    <div class="lgmp-field"><strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.point') || "What's the Point?"}</strong><br>
      <em>(What hook or goal does this introduce?)</em>
      <div class="lgmp-card-fill"></div>
    </div>
    <div class="lgmp-field"><strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.action') || "Where's the Action?"}</strong><br>
      <em>(Describe the immediate action or conflict)</em>
      <div class="lgmp-card-fill"></div>
    </div>
    <div class="lgmp-field"><strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.sensory') || "Sensory Details"}</strong><br>
      <em>(Optional: sights, sounds, smells, etc.)</em>
      <div class="lgmp-card-fill"></div>
    </div>
    <div class="lgmp-field"><strong>${game.i18n.localize('lazy-gm-prep.strong-start.card.notes') || "Loose Notes"}</strong><br>
      <em>(Any other GM notes)</em>
      <div class="lgmp-card-fill"></div>
    </div>
  </div>
  `;

  // Compose the page: Description (not collapsible), then the card (open by default), then notes (collapsed)
  let html = "";
  html += sectionDescription(def);

  // SECTION: Strong Start Card — open by default
  html += renderDetailsBlock(
    "lazy-gm-prep.strong-start.card.heading", // e.g., "Strong Start"
    strongStartCard,
    true,
    "lgmp-strong-start-block"
  );

  // SECTION: Notes — collapsed by default
  html += renderDetailsBlock(
    "lazy-gm-prep.steps.other-notes.title", // reuse "Other Notes"
    notesPlaceholder(),
    false,
    "lgmp-notes-block"
  );

  return { name: title, type: 'text', text: { format: 1, content: html } };
}

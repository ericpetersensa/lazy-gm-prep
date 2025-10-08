// src/journal/pages/fantasticLocations.js
import { notesPlaceholder } from '../helpers.js';

/**
 * Create the "Develop Fantastic Locations" page.
 * - If prevContent is provided and non-empty, it is returned verbatim.
 * - Otherwise, renders a short description, a collapsible Prompts block,
 *   and three prebuilt Location templates.
 */
export function createFantasticLocationsPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // If we have previous content (carry-forward), respect it exactly.
  if (prevContent && String(prevContent).trim()) {
    return {
      name: title,
      type: 'text',
      text: { format: 1, content: String(prevContent) }
    };
  }

  let html = '';
  html += descriptionHTML();
  html += promptsHTML();
  html += templatesHTML();

  return {
    name: title,
    type: 'text',
    text: { format: 1, content: html }
  };
}

function descriptionHTML() {
  const desc =
    "Name striking places and jot a few evocative details—scale, age, weirdness, " +
    "sensory cues. Keep it flexible so you can drop them in as scenes evolve.";
  return `
<p>${escapeHtml(desc)}</p>
<hr>
`;
}

/**
 * Prompts block—keeps the localized heading ("Prompts") but uses inline items
 * so we don't have to touch en.json.
 */
function promptsHTML() {
  const heading = game.i18n.localize("lazy-gm-prep.prompts.heading") || "Prompts";
  const items = [
    "What makes this place memorable in one sentence?",
    "What sights, sounds, smells, or textures define it?",
    "What’s the *tension* here—why is it dangerous, sacred, or coveted?",
    "What hooks connect it to the PCs (rumors, bonds, items, foes)?"
  ].map(escapeHtml);

  return `
<details class="lgmp-prompts">
  <summary>${escapeHtml(heading)}</summary>
  <ul class="lgmp-prompts">
    ${items.map(i => `<li>${i}</li>`).join("\n")}
  </ul>
</details>
`;
}

function templatesHTML() {
  const blocks = [1, 2, 3].map(n => locationCardHTML(n)).join('\n');
  return `
<div class="lgmp-scenes">
  ${blocks}
</div>
`;
}

function locationCardHTML(n) {
  return `
<div class="lgmp-scene">
  <h5>Location ${n}</h5>

  <div class="lgmp-field">
    <strong>Name:</strong> (e.g., “The Lantern Steps”)
  </div>

  <div class="lgmp-field">
    <strong>Vibe / Theme:</strong> (1–2 words: forlorn, humming, labyrinthine, fungal)
  </div>

  <div class="lgmp-field">
    <strong>Distinctive Features (pick 2–4):</strong>
    <ul class="lgmp-keylist">
      <li>Scale / Age / Weirdness</li>
      <li>Signature Sound / Smell / Texture</li>
      <li>Hazard or Constraint (dark, slick, narrow, toxic air)</li>
      <li>Power / Custodian (spirit, guild, noble, entity)</li>
    </ul>
  </div>

  <div class="lgmp-field">
    <strong>Points of Interest:</strong> (altars, machines, vantage points, lairs)
  </div>

  <div class="lgmp-field">
    <strong>Scenes that could happen here:</strong> (social, exploration, combat)
  </div>

  <div class="lgmp-field">
    <strong>Loose Notes:</strong>
    ${notesPlaceholder()}
  </div>
</div>
`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>\"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

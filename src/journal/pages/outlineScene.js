
// src/journal/pages/outlineScene.js

import {
  notesPlaceholder,
  renderPromptsBlock
} from '../helpers.js';

export function createOutlineScenesPage(def, prevContent) {
  const title = game.i18n.localize(def.titleKey);

  // Description from i18n
  const desc = game.i18n.localize("lazy-gm-prep.steps.outline-scenes.description");
  let html = `<div class="lgmp-section">${escapeHtml(desc)}</div>`;

  // Prompts section (collapsed by default)
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
    <details class="lgmp-scenes-block" open>
      <summary>${escapeHtml(scenesHeading)}</summary>
      <div class="lgmp-scenes">
        ${buildScenesHTML(prevContent, 3)}
      </div>
    </details>
    <script>
      // Interactive toggle for checklist markers (☐ ↔ ☑) in view mode
      document.addEventListener("DOMContentLoaded", function() {
        document.querySelectorAll(".lgmp-scene .lgmp-checklist li").forEach(function(li) {
          li.addEventListener("click", function() {
            const t = li.textContent.trim();
            if (t.startsWith("☐")) li.textContent = t.replace(/^☐/, "☑");
            else if (t.startsWith("☑")) li.textContent = t.replace(/^☑/, "☐");
          });
        });
      });
    </script>
  `;

  return { name: title, type: 'text', text: { format: 1, content: html } };
}

/**
 * Build Scenes HTML by carrying over non-done cards and adding blanks to reach minCount.
 * No numbering—cards use a generic title from i18n.
 */
function buildScenesHTML(prevContent, minCount = 3) {
  const kept = extractNonDoneScenes(prevContent); // array of HTML strings
  const cards = [...kept];

  const needed = Math.max(0, minCount - cards.length);
  for (let i = 0; i < needed; i++) {
    cards.push(sceneCardHTML());
  }
  return cards.join("\n");
}

/**
 * Extract scenes from previous content, return only those NOT checked (☐ Done).
 * A scene is considered "Done" if it contains a checklist item starting with ☑.
 */
function extractNonDoneScenes(prevContent) {
  if (!prevContent || !String(prevContent).trim()) return [];

  const doc = new DOMParser().parseFromString(String(prevContent), "text/html");
  const sceneNodes = Array.from(doc.querySelectorAll(".lgmp-scene"));

  const keep = sceneNodes.filter(node => {
    const li = node.querySelector("ul.lgmp-checklist li");
    const text = (li?.textContent ?? "").trim();
    return !(text.startsWith("☑")); // keep if NOT marked done
  });

  return keep.map(node => node.outerHTML);
}

/**
 * Fresh blank scene card with checklist-style Done marker (unchecked by default).
 * Uses the generic card title i18n key: lazy-gm-prep.strong-start.card.title
 */
function sceneCardHTML() {
  const cardTitle = game.i18n.localize("lazy-gm-prep.strong-start.card.title") || "Strong Start";

  return `
    <div class="lgmp-scene">
      <ul class="lgmp-checklist">
        <li>☐ Done</li>
      </ul>

      <h5 class="lgmp-card-title">${escapeHtml(cardTitle)}</h5>

      <div class="lgmp-field">
        <strong>${escapeHtml(game.i18n.localize("lazy-gm-prep.strong-start.card.whatsHappening") || "What's Happening?")}</strong>
        <div class="lgmp-card-fill">(Describe the event or change that kicks off the session)</div>
      </div>

      <div class="lgmp-field">
        <strong>${escapeHtml(game.i18n.localize("lazy-gm-prep.strong-start.card.point") || "What's the Point?")}</strong>
        <div class="lgmp-card-fill">(What hook or goal does this introduce?)</div>
      </div>

      <div class="lgmp-field">
        <strong>${escapeHtml(game.i18n.localize("lazy-gm-prep.strong-start.card.action") || "Where's the Action?")}</strong>
        <div class="lgmp-card-fill">(Describe the immediate action or conflict)</div>
      </div>

      <div class="lgmp-field">
        <strong>${escapeHtml(game.i18n.localize("lazy-gm-prep.strong-start.card.sensory") || "Sensory Details")}</strong>
        <div class="lgmp-card-fill">(Optional: sights, sounds, smells, etc.)</div>
      </div>

      <div class="lgmp-field">
        <strong>${escapeHtml(game.i18n.localize("lazy-gm-prep.strong-start.card.notes") || "Loose Notes")}</strong>
        <div class="lgmp-card-fill">(Any other GM notes)</div>
        ${notesPlaceholder()}
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

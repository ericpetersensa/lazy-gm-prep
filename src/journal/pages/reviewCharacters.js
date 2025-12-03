
// src/journal/pages/reviewCharacters.js
import {
  sectionDescription,
  quickCheckHTML,
  notesPlaceholder,
  characterReviewTableHTML,
  gmReviewPromptsHTML,
  renderDetailsBlock
} from '../helpers.js';

export function createReviewCharactersPage(def, prevContent, initialRows = 5) {
  // If copying previous content, use it directly—no template needed
  if (prevContent && prevContent.trim()) {
    return {
      name: game.i18n.localize(def.titleKey),
      type: 'text',
      text: { format: 1, content: prevContent }
    };
  }

  // Compose a single collapsible for Prompts + Lazy Tip (closed by default)
  const promptsAndTipHTML =
    gmReviewPromptsHTML() +     // <ul class="lgmp-prompts">...</ul>
    quickCheckHTML();           // <blockquote>Lazy Tip: …</blockquote>

  const content =
    // Section description at the top (not collapsible)
    sectionDescription(def) +

    // SECTION: Prompts (+ Lazy Tip) — collapsed by default
    renderDetailsBlock(
      "lazy-gm-prep.prompts.heading", // summary label: "Prompts"
      promptsAndTipHTML,
      false,                          // start collapsed
      "lgmp-prompts-block"
    ) +

    // SECTION: Characters — OPEN by default (main content)
    renderDetailsBlock(
      "lazy-gm-prep.characters.table.heading", // summary label: "Characters"
      characterReviewTableHTML(initialRows),
      true,                                    // start OPEN (main content)
      "lgmp-characters-block"
    ) +

    // SECTION: Notes — collapsed by default
    renderDetailsBlock(
      "lazy-gm-prep.steps.other-notes.title", // reuse existing i18n key: "Other Notes"
      notesPlaceholder(),
      false,
      "lgmp-notes-block"
    );

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}

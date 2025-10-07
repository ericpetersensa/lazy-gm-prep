// src/journal/pages/reviewCharacters.js
import {
  sectionDescription,
  quickCheckHTML,
  notesPlaceholder,
  characterReviewTableHTML,
  renderPromptsBlock
} from '../helpers.js';

export function createReviewCharactersPage(def, prevContent, initialRows = 5) {
  if (prevContent && prevContent.trim()) {
    return {
      name: game.i18n.localize(def.titleKey),
      type: 'text',
      text: { format: 1, content: prevContent }
    };
  }

  const promptKeys = [
    "lazy-gm-prep.characters.prompts.spotlight",
    "lazy-gm-prep.characters.prompts.unresolved",
    "lazy-gm-prep.characters.prompts.bonds",
    "lazy-gm-prep.characters.prompts.reward"
  ];

  const content =
    sectionDescription(def) +
    renderPromptsBlock(promptKeys) +
    quickCheckHTML() +
    characterReviewTableHTML(initialRows) +
    notesPlaceholder();

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}

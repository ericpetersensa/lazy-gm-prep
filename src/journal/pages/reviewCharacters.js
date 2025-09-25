// src/journal/pages/reviewCharacters.js

import {
  sectionDescription,
  quickCheckHTML,
  notesPlaceholder,
  characterReviewTableHTML,
  gmReviewPromptsHTML
} from '../helpers.js';

export function createReviewCharactersPage(def, prevContent, initialRows = 5) {
  // Build the page with your exact flow: Description -> Quick Check -> Table -> Prompts -> Notes
  const template =
    sectionDescription(def) +
    quickCheckHTML() +
    characterReviewTableHTML(initialRows) +
    gmReviewPromptsHTML() +
    notesPlaceholder();

  const content = (prevContent && prevContent.trim()) ? prevContent : template;

  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}

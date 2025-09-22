// src/journal/pages/reviewCharacters.js
import { sectionDescription, notesPlaceholder, characterReviewTableHTML, gmReviewPromptsHTML } from '../helpers.js';

export function createReviewCharactersPage(def, prevContent, initialRows = 5) {
  let content;
  if (prevContent) {
    content = prevContent.trim()
      ? prevContent
      : sectionDescription(def) + characterReviewTableHTML(initialRows) + gmReviewPromptsHTML() + notesPlaceholder();
  } else {
    content = sectionDescription(def) + characterReviewTableHTML(initialRows) + gmReviewPromptsHTML() + notesPlaceholder();
  }
  return {
    name: game.i18n.localize(def.titleKey),
    type: 'text',
    text: { format: 1, content }
  };
}

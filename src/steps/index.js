// src/steps/index.js

/**
 * Registry of the Lazy DM prep steps.
 * Each step references i18n keys for title and description.
 */
export const STEP_DEFS = [
  {
    key: "review-characters",
    titleKey: "lazy-gm-prep.steps.review-characters.title",
    descriptionKey: "lazy-gm-prep.steps.review-characters.description",
    numbered: true
  },
  {
    key: "strong-start",
    titleKey: "lazy-gm-prep.steps.strong-start.title",
    descriptionKey: "lazy-gm-prep.steps.strong-start.description",
    numbered: true
  },
  {
    key: "outline-scenes",
    titleKey: "lazy-gm-prep.steps.outline-scenes.title",
    descriptionKey: "lazy-gm-prep.steps.outline-scenes.description",
    numbered: true
  },
  {
    key: "secrets-clues",
    titleKey: "lazy-gm-prep.steps.secrets-clues.title",
    descriptionKey: "lazy-gm-prep.steps.secrets-clues.description",
    numbered: true
  },
  {
    key: "fantastic-locations",
    titleKey: "lazy-gm-prep.steps.fantastic-locations.title",
    descriptionKey: "lazy-gm-prep.steps.fantastic-locations.description",
    numbered: true
  },
  {
    key: "important-npcs",
    titleKey: "lazy-gm-prep.steps.important-npcs.title",
    descriptionKey: "lazy-gm-prep.steps.important-npcs.description",
    numbered: true
  },
  {
    key: "choose-monsters",
    titleKey: "lazy-gm-prep.steps.choose-monsters.title",
    descriptionKey: "lazy-gm-prep.steps.choose-monsters.description",
    numbered: true
  },
  {
    key: "magic-item-rewards",
    titleKey: "lazy-gm-prep.steps.magic-item-rewards.title",
    descriptionKey: "lazy-gm-prep.steps.magic-item-rewards.description",
    numbered: true
  },
  {
    key: "other-notes",
    titleKey: "lazy-gm-prep.steps.other-notes.title",
    descriptionKey: "lazy-gm-prep.steps.other-notes.description",
    numbered: false
  }
];

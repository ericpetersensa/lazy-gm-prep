// src/journal/pages/gettingStarted.js

import { PAGE_ORDER } from "../../settings.js";

/**
 * Build the "Page Help" section:
 *  - Heading: "Page Help"
 *  - One <details> per page you want onboarding for (currently: Review the Characters)
 *  - Inside each: subtitle "Column Explanations" + bullets
 */
function buildPageHelpHTML() {
  const heading = game.i18n.localize("lazy-gm-prep.getting-started.sections.heading");

  // Help for "1. Review the Characters" only (expand later as needed)
  const reviewCharactersHelp = (() => {
    const pageTitle = game.i18n.localize("lazy-gm-prep.steps.review-characters.title");
    const sub = game.i18n.localize("lazy-gm-prep.getting-started.sections.subheading.columnExplanations");
    const pcName = game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.pcName");
    const concept = game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.conceptRole");
    const goal = game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.goalHook");
    const recent = game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.recentNote");

    return `
      <details>
        <summary><strong>${pageTitle}</strong></summary>
        <p><strong>${sub}</strong></p>
        <ul>
          <li><strong>PC Name:</strong> ${pcName}</li>
          <li><strong>Concept/Role:</strong> ${concept}</li>
          <li><strong>Goal/Hook:</strong> ${goal}</li>
          <li><strong>Recent Note:</strong> ${recent}</li>
        </ul>
      </details>
    `;
  })();

  // If you add more pages later, concatenate them here
  const blocks = [reviewCharactersHelp].join("\n");

  return `
    <hr>
    <h2>${heading}</h2>
    ${blocks}
  `;
}

/**
 * Create the Getting Started page.
 * NOTE: We do NOT include an in-body <h1> "Getting Started" to avoid duplicating the page name
 * shown by the journal sheet chrome. We only render the H2 section headings below.
 */
export function createGettingStartedPage() {
  const quickStartTitle = game.i18n.localize("lazy-gm-prep.getting-started.quickstart.title");
  const quickStartBody  = game.i18n.localize("lazy-gm-prep.getting-started.quickstart.body");

  const workflowTitle = game.i18n.localize("lazy-gm-prep.getting-started.workflow.title");
  const workflowBody  = game.i18n.localize("lazy-gm-prep.getting-started.workflow.body");

  const knowTitle = game.i18n.localize("lazy-gm-prep.getting-started.know.title");
  const knowBody  = game.i18n.localize("lazy-gm-prep.getting-started.know.body");

  const base = `
    <h2>${quickStartTitle}</h2>
    <p>${quickStartBody}</p>

    <h2>${workflowTitle}</h2>
    <p>${workflowBody}</p>

    <h2>${knowTitle}</h2>
    <p>${knowBody}</p>
  `;

  const pageHelp = buildPageHelpHTML();
  const content  = `${base}\n${pageHelp}`;

  return {
    name: game.i18n.localize("lazy-gm-prep.getting-started.title"),
    type: "text",
    text: { format: 1, content }
  };
}

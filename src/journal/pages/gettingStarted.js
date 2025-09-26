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

  const blocks = [reviewCharactersHelp].join("\n");

  return `
    <hr>
    <h2>${heading}</h2>
    ${blocks}
  `;
}

/**
 * Create the Getting Started page (restore original content without an in-body <h1>).
 * The sheet chrome already shows the page title, so we render only sections below.
 */
export function createGettingStartedPage() {
  const welcome = game.i18n.localize("lazy-gm-prep.getting-started.welcome");

  const otherTitle = game.i18n.localize("lazy-gm-prep.getting-started.other-options.title");
  const otherItems = [
    game.i18n.localize("lazy-gm-prep.getting-started.other-options.altp"),
    game.i18n.localize("lazy-gm-prep.getting-started.other-options.chatprep")
  ].map(s => `<li>${s}</li>`).join("\n");

  const settingsTitle = game.i18n.localize("lazy-gm-prep.getting-started.settings.title-simple");
  const settingsItems = [
    game.i18n.localize("lazy-gm-prep.getting-started.settings.separatePages"),
    game.i18n.localize("lazy-gm-prep.getting-started.settings.folderName"),
    game.i18n.localize("lazy-gm-prep.getting-started.settings.journalPrefix"),
    game.i18n.localize("lazy-gm-prep.getting-started.settings.includeDate"),
    game.i18n.localize("lazy-gm-prep.getting-started.settings.defaultRows"),
    game.i18n.localize("lazy-gm-prep.getting-started.settings.copyPrevious")
  ].map(s => `<li>${s}</li>`).join("\n");

  const goodTitle = game.i18n.localize("lazy-gm-prep.getting-started.good.title");
  const goodItems = [
    game.i18n.localize("lazy-gm-prep.getting-started.good.secretsCarry"),
    game.i18n.localize("lazy-gm-prep.getting-started.good.editableTables"),
    game.i18n.localize("lazy-gm-prep.getting-started.good.dragDrop")
  ].map(s => `<li>${s}</li>`).join("\n");

  // NOTE: No <h1> here—prevents duplicate "Getting Started"
  const base = `
    <p>${welcome}</p>

    <h2>${otherTitle}</h2>
    <ul>
      ${otherItems}
    </ul>

    <h2>${settingsTitle}</h2>
    <ul>
      ${settingsItems}
    </ul>

    <h2>${goodTitle}</h2>
    <ul>
      ${goodItems}
    </ul>
  `;

  const pageHelp = buildPageHelpHTML();
  const content = `${base}\n${pageHelp}`;

  return {
    name: game.i18n.localize("lazy-gm-prep.getting-started.title"),
    type: "text",
    text: { format: 1, content }
  };
}

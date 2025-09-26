// src/journal/pages/gettingStarted.js

import { PAGE_ORDER } from "../../settings.js";

/**
 * Build one <details> block per step (e.g., Review the Characters).
 * Each block is collapsed by default and contains step-specific onboarding tips.
 * This section is appended at the end of the Getting Started page for Session 0 only.
 */
function buildPerStepHelpHTML() {
  const heading = game.i18n.localize("lazy-gm-prep.getting-started.sections.heading");
  const intro = game.i18n.localize("lazy-gm-prep.getting-started.sections.intro");

  // Map each step key -> HTML content (short and practical).
  const stepHelp = {
    "review-characters": `
      <p><em>${game.i18n.localize("lazy-gm-prep.steps.review-characters.description")}</em></p>
      <details>
        <summary><strong>${game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.title")}</strong></summary>
        <ul>
          <li><strong>PC Name:</strong> ${game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.pcName")}</li>
          <li><strong>Concept/Role:</strong> ${game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.conceptRole")}</li>
          <li><strong>Goal/Hook:</strong> ${game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.goalHook")}</li>
          <li><strong>Recent Note:</strong> ${game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.recentNote")}</li>
        </ul>
      </details>
    `
    // Add more step help blocks later as you author them.
  };

  const blocks = PAGE_ORDER
    .filter(def => stepHelp[def.key])
    .map(def => {
      const title = game.i18n.localize(def.titleKey);
      const inner = stepHelp[def.key];
      return `
        <section class="lgmp-step-help">
          <h3>${title}</h3>
          ${inner}
        </section>`;
    })
    .join("\n");

  if (!blocks) return "";

  return `
    <hr>
    <h2>${heading}</h2>
    <p class="lgmp-step-help-intro">${intro}</p>
    ${blocks}
  `;
}

/**
 * Create the Getting Started page for Session 0.
 * Restores your original sections (Welcome, Other Options, Module Settings, Good to Know)
 * and appends the per-step collapsible help at the end.
 */
export function createGettingStartedPage() {
  const title = game.i18n.localize("lazy-gm-prep.getting-started.title");

  // --- Original content restored ---
  const welcome = game.i18n.localize("lazy-gm-prep.getting-started.welcome");

  const otherTitle = game.i18n.localize("lazy-gm-prep.getting-started.other-options.title");
  const otherAltP = game.i18n.localize("lazy-gm-prep.getting-started.other-options.altp");
  const otherSlash = game.i18n.localize("lazy-gm-prep.getting-started.other-options.slashprep");

  const settingsTitle = game.i18n.localize("lazy-gm-prep.getting-started.module-settings.title");
  const setSeparate = game.i18n.localize("lazy-gm-prep.getting-started.module-settings.separatePages");
  const setFolder = game.i18n.localize("lazy-gm-prep.getting-started.module-settings.folderName");
  const setPrefix = game.i18n.localize("lazy-gm-prep.getting-started.module-settings.journalPrefix");
  const setIncludeDate = game.i18n.localize("lazy-gm-prep.getting-started.module-settings.includeDate");
  const setDefaultRows = game.i18n.localize("lazy-gm-prep.getting-started.module-settings.defaultRows");
  const setCopyPrev = game.i18n.localize("lazy-gm-prep.getting-started.module-settings.copyPrevious");

  const goodTitle = game.i18n.localize("lazy-gm-prep.getting-started.good.title");
  const goodSecrets = game.i18n.localize("lazy-gm-prep.getting-started.good.secretsCarryForward");
  const goodTables = game.i18n.localize("lazy-gm-prep.getting-started.good.editableTables");
  const goodDrag = game.i18n.localize("lazy-gm-prep.getting-started.good.dragDrop");

  const settingsBtn = game.i18n.localize("lazy-gm-prep.getting-started.settings.button");

  const baseHtml = `
    <h1>${title}</h1>

    <p>${welcome}</p>

    <h3>${otherTitle}</h3>
    <ul>
      <li>${otherAltP}</li>
      <li>${otherSlash}</li>
    </ul>

    <h3>${settingsTitle}</h3>
    <ul>
      <li>${setSeparate}</li>
      <li>${setFolder}</li>
      <li>${setPrefix}</li>
      <li>${setIncludeDate}</li>
      <li>${setDefaultRows}</li>
      <li>${setCopyPrev}</li>
    </ul>

    <h3>${goodTitle}</h3>
    <ul>
      <li>${goodSecrets}</li>
      <li>${goodTables}</li>
      <li>${goodDrag}</li>
    </ul>

    <p>
      #${settingsBtn}</a>
    </p>
  `;

  // --- Append per-step help (collapsible) ---
  const perStep = buildPerStepHelpHTML();

  return {
    name: title,
    type: "text",
    text: { format: 1, content: `${baseHtml}\n${perStep}` }
  };
}

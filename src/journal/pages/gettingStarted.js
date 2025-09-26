// src/journal/pages/gettingStarted.js

import { PAGE_ORDER } from "../../settings.js";

function buildPageHelpHTML() {
  const heading = game.i18n.localize("lazy-gm-prep.getting-started.sections.heading");

  // Only include Review the Characters for now, but you can expand this for other pages.
  const stepHelp = {
    "review-characters": `
      <details>
        <summary><strong>${game.i18n.localize("lazy-gm-prep.steps.review-characters.title")}</strong></summary>
        <ul>
          <li><strong>PC Name:</strong> ${game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.pcName")}</li>
          <li><strong>Concept/Role:</strong> ${game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.conceptRole")}</li>
          <li><strong>Goal/Hook:</strong> ${game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.goalHook")}</li>
          <li><strong>Recent Note:</strong> ${game.i18n.localize("lazy-gm-prep.getting-started.sections.review-characters.recentNote")}</li>
        </ul>
      </details>
    `
    // Add more steps here as needed.
  };

  const blocks = PAGE_ORDER
    .filter(def => stepHelp[def.key])
    .map(def => stepHelp[def.key])
    .join("\n");

  if (!blocks) return "";

  return `
    <hr>
    <h2>${heading}</h2>
    ${blocks}
  `;
}

export function createGettingStartedPage() {
  const base = `
    <h1>${game.i18n.localize("lazy-gm-prep.getting-started.title")}</h1>
    <h3>${game.i18n.localize("lazy-gm-prep.getting-started.quickstart.title")}</h3>
    <p>${game.i18n.localize("lazy-gm-prep.getting-started.workflow.title")}</p>
    <h3>${game.i18n.localize("lazy-gm-prep.getting-started.know.title")}</h3>
  `;

  const pageHelp = buildPageHelpHTML();
  const content = `${base}\n${pageHelp}`;

  return {
    name: game.i18n.localize("lazy-gm-prep.getting-started.title"),
    type: "text",
    text: { format: 1, content }
  };
}

// src/journal/pages/gettingStarted.js

import { PAGE_ORDER } from "../../settings.js";

/**
 * Build one <details> block per step (e.g., Review the Characters, Strong Start, etc.).
 * Each block is collapsed by default and contains step-specific onboarding tips.
 */
function buildPerStepHelpHTML() {
  const heading = game.i18n.localize("lazy-gm-prep.getting-started.sections.heading");

  // Map each step key -> HTML content (keep it short and practical).
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
    `,
    // Add more steps here as you expand your onboarding help!
    // "strong-start": `<details>...</details>`,
    // "secrets-clues": `<details>...</details>`,
    // etc.
  };

  // Render one block per step that has help content defined.
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

  if (!blocks) return ""; // nothing to show

  return `
    <hr>
    <h2>${heading}</h2>
    <p class="lgmp-step-help-intro">${game.i18n.localize("lazy-gm-prep.getting-started.sections.intro")}</p>
    ${blocks}
  `;
}

/**
 * Create the Getting Started page.
 * If you already had base content here, keep it and append the per-step help.
 */
export function createGettingStartedPage() {
  // You can keep or expand this base header. (We use existing i18n keys already in your en.json.)
  const base = `
    <h1>${game.i18n.localize("lazy-gm-prep.getting-started.title")}</h1>
    <h3>${game.i18n.localize("lazy-gm-prep.getting-started.quickstart.title")}</h3>
    <p>${game.i18n.localize("lazy-gm-prep.getting-started.workflow.title")}</p>
    <h3>${game.i18n.localize("lazy-gm-prep.getting-started.know.title")}</h3>
  `;

  const perStep = buildPerStepHelpHTML();
  const content = `${base}\n${perStep}`;

  return {
    name: game.i18n.localize("lazy-gm-prep.getting-started.title"),
    type: "text",
    text: { format: 1, content }
  };
}

// src/journal/generator.js
import { MODULE_ID, SETTINGS } from "../constants.js";
import { PAGE_ORDER, getSetting } from "../settings.js";

/* ... [all other code unchanged] ... */

function gettingStartedBodyHTML({ prefix }) {
  // Updated section title and bullets per user request
  const otherOptionsTitle = "Other Journal Creation Options";
  const settingsTitle   = escapeHtml(game.i18n.localize("lazy-gm-prep.getting-started.settings.title"));
  const knowTitle       = escapeHtml(game.i18n.localize("lazy-gm-prep.getting-started.know.title"));

  const separatePagesLabel = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.separatePages.name"));
  const folderNameLabel    = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.folderName.name"));
  const prefixLabel        = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.journalPrefix.name"));
  const includeDateLabel   = escapeHtml(game.i18n.localize("lazy-gm-prep.settings.includeDateInName.name"));

  return `
<p class="lgmp-step-desc">
Welcome! This module generates a lightweight prep journal that follows the “Return of the Lazy Dungeon Master” flow.
You’re on <strong>${escapeHtml(prefix)} 0</strong>. From here on, you’ll create a new journal per session.
</p>

<h3 style="margin:0.5rem 0 0">${otherOptionsTitle}</h3>
<ol>
  <li>Press <kbd>Alt</kbd>+<kbd>P</kbd> (GM only) to create the next prep journal.</li>
  <li>Type <code>/prep</code> in chat to generate a new prep journal.</li>
</ol>

<h3 style="margin:0.75rem 0 0">${settingsTitle}</h3>
<ul>
  <li><strong>${separatePagesLabel}</strong>: A checkmark means that each step will have its own page. With it unchecked, all steps are combined into a single page. <em>(Default – Enabled)</em></li>
  <li><strong>${folderNameLabel}</strong>: Type the folder name you want journals to be created under. <em>(Default – Lazy GM Prep)</em></li>
  <li><strong>${prefixLabel}</strong>: Type the journal name you want used. <em>(Default – Session)</em></li>
  <li><strong>${includeDateLabel}</strong>: A checkmark means that it will append the date on to the name of the journal <em>(Default – Enabled)</em></li>
  <li><strong>Default rows in X (Characters and NPC pages)</strong>: While you can add or remove rows manually, this allows you to start with a set number of rows. <em>(Default – 5)</em></li>
  <li><strong>Copy Previous X (All pages)</strong>: Each step can copy prior content or be toggled off if you don't want that page copied to the next journal. <em>(Default – Enabled)</em></li>
</ul>

<h3 style="margin:0.75rem 0 0">${knowTitle}</h3>
<ul>
  <li><strong>Secrets &amp; Clues carry forward:</strong> Only <em>unchecked</em> secrets from the prior session are brought forward and topped up to 10.</li>
  <li><strong>Editable Tables:</strong> Use the standard table options on the Characters and NPC pages to add or remove rows or columns.</li>
  <li><strong>Actors, NPCs, and other items:</strong> Once your players have created their characters, drag and drop them into the “1. Review the Characters” table (one per row) for one‑click access to their character sheets. Same for NPCs and other items.</li>
</ul>

<hr/>
<p style="margin:0.5rem 0 0.25rem">
  <button type="button" class="lgmp-open-settings-btn" data-lazy-open-settings aria-label="Open Module Settings">
    <i class="fa-solid fa-gear" aria-hidden="true"></i><span>Open Module Settings</span>
  </button>
</p>
`.trim() + "\n";
}

/* ... [all other code unchanged] ... */

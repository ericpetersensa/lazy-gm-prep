// src/journal/pages/gettingStarted.js
import { getSetting } from '../../settings.js';

function gettingStartedBodyHTML({ prefix }) {
  // Build HTML using single-line, double-quoted JS strings to avoid unescaped line-break issues.
  let html = "";
  html += "<p>Welcome! This module generates a lightweight prep journal that follows the \"Return of the Lazy Dungeon Master\" flow. ";
  html += "You're on " + prefix + " 0. From here on, you'll create a new journal per session.</p>";

  html += "<h5>Other Journal Creation Options</h5>";
  html += "<ul>";
  html += "  <li>Press <strong>Alt+P</strong> (GM only) to create the next prep journal.</li>";
  html += "  <li>Type <strong>/prep</strong> in chat to generate a new prep journal.</li>";
  html += "</ul>";

  html += "<h5>Module Settings</h5>";
  html += "<ul>";
  html += "  <li><strong>Separate Pages</strong>: Each step will have its own page. With it unchecked, all steps are combined into a single page. (Default – Enabled)</li>";
  html += "  <li><strong>Folder Name</strong>: The folder in which journals are created. (Default – Lazy GM Prep)</li>";
  html += "  <li><strong>Journal Prefix</strong>: The journal name prefix. (Default – Session)</li>";
  html += "  <li><strong>Include Date</strong>: Appends today's date to the journal name. (Default – Enabled)</li>";
  html += "  <li><strong>Default rows in Characters and NPC pages</strong>: Start with a set number of rows. (Default – 5)</li>";
  html += "  <li><strong>Copy Previous</strong>: Each step can copy prior content into the next journal. (Default – Enabled)</li>";
  html += "</ul>";

  html += "<h5>Good to Know</h5>";
  html += "<ul>";
  html += "  <li><strong>Secrets &amp; Clues carry forward</strong>: Only unchecked secrets from the prior session are brought forward and topped up to 10.</li>";
  html += "  <li><strong>Editable Tables</strong>: Use Foundry's table tools to add/remove rows or columns.</li>";
  html += "  <li><strong>Drag &amp; Drop</strong>: Drop actors/items into the \"Review the Characters\" table for one-click access to sheets. Same for NPCs and other items.</li>";
  html += "</ul>";

  // --- Actual clickable Settings button (gear icon + label) ---
  // NOTE: main.js's bindOpenSettings() looks for [data-lazy-open-settings] and opens the settings sheet.
  html += "<p>";
  html += "  <a href='#' class='lgmp-open-settings fa-gear fas fa-cog' aria-hidden='true'></i> Settings";
  html += "  </a>";
  html += "  <span class='hint' style='opacity:.8'> (Configure Settings &gt; Lazy GM Prep)</span>";
  html += "</p>";

  return html + "\n";
}

export function createGettingStartedPage() {
  const prefix = getSetting('journalPrefix', 'Session');
  const content = gettingStartedBodyHTML({ prefix });

  return {
    name: game.i18n.localize("lazy-gm-prep.getting-started.title"),
    type: "text",
    text: { format: 1, content } // HTML
  };
}

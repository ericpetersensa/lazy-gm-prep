// src/journal/pages/gettingStarted.js
import { getSetting } from '../../settings.js';

function gettingStartedBodyHTML({ prefix }) {
  const openSettingsLabel = game.i18n.localize("lazy-gm-prep.getting-started.settings.title");

  return `
<p>Welcome! This module generates a lightweight prep journal that follows the “Return of the Lazy Dungeon Master” flow. You’re on <strong>${prefix} 0</strong>. From here on, you’ll create a new journal per session.</p>

<h4>Other Journal Creation Options</h4>
<ul>
  <li>Press <strong>Alt+P</strong> (GM only) to create the next prep journal.</li>
</ul>
<pre><code>/prep</code></pre>
<p>Type in chat to generate a new prep journal.</p>

<h4>Module Settings</h4>
<ul>
  <li><strong>Separate Pages</strong>: Each step will have its own page. With it unchecked, all steps are combined into a single page. (Default – Enabled)</li>
  <li><strong>Folder Name</strong>: The folder in which journals are created. (Default – Lazy GM Prep)</li>
  <li><strong>Journal Prefix</strong>: The journal name prefix. (Default – Session)</li>
  <li><strong>Include Date</strong>: Appends today’s date to the journal name. (Default – Enabled)</li>
  <li><strong>Default rows</strong> in Characters and NPC pages: Start with a set number of rows. (Default – 5)</li>
  <li><strong>Copy Previous</strong>: Each step can copy prior content into the next journal. (Default – Enabled)</li>
</ul>

<h4>Good to Know</h4>
<ul>
  <li><strong>Secrets &amp; Clues carry forward</strong>: Only unchecked secrets from the prior session are brought forward and topped up to 10.</li>
  <li><strong>Editable Tables</strong>: Use Foundry’s table tools to add/remove rows or columns.</li>
  <li><strong>Drag &amp; Drop</strong>: Drop actors/items into the “Review the Characters” table for one‑click access to sheets. Same for NPCs and other items.</li>
</ul>

<p>
  #
    <i class="fa-solid fa-gear"></i> ${openSettingsLabel}
  </a>
</p>
`.trim() + "\n";
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

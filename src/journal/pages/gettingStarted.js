// src/journal/pages/gettingStarted.js
import { getSetting } from '../settings.js';

function gettingStartedBodyHTML({ prefix }) {
  return `
Welcome! This module generates a lightweight prep journal that follows the “Return of the Lazy Dungeon Master” flow. You’re on ${prefix} 0. From here on, you’ll create a new journal per session.

#### Other Journal Creation Options
- Press Alt+P (GM only) to create the next prep journal.
\`\`\`
/prep
\`\`\`
Type in chat to generate a new prep journal.

#### Module Settings
- Separate Pages: Each step will have its own page. With it unchecked, all steps are combined into a single page. (Default – Enabled)
- Folder Name: Type the folder name you want journals to be created under. (Default – Lazy GM Prep)
- Journal Prefix: Type the journal name you want used. (Default – Session)
- Include Date: Appends the date to the name of the journal (Default – Enabled)
- Default rows in Characters and NPC pages: Allows you to start with a set number of rows. (Default – 5)
- Copy Previous: Each step can copy prior content or be toggled off if you don't want that page copied to the next journal. (Default – Enabled)

#### Good to Know
- Secrets & Clues carry forward: Only unchecked secrets from the prior session are brought forward and topped up to 10.
- Editable Tables: Use the default Foundry table options on the Characters and NPC pages to add or remove rows or columns.
- Actors, NPCs, and other items: Drag and drop them into the “Review the Characters” table for one‑click access to their character sheets. Same for NPCs and other items.

<a  ${game.i18n.localize("lazy-gm-prep.getting-started.settings.title")}
</a>
`.trim() + "\n";
}

export function createGettingStartedPage() {
  const prefix = getSetting('journalPrefix', 'Session');
  const content = gettingStartedBodyHTML({ prefix });
  return {
    name: game.i18n.localize("lazy-gm-prep.getting-started.title"),
    type: "text",
    text: { format: 1, content }
  };
}

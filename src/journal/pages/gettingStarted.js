function gettingStartedBodyHTML({ prefix }) {
  return `
    <p>
      Welcome! This module generates a lightweight prep journal that follows the “Return of the Lazy Dungeon Master” flow.
      You’re on ${prefix} 0. From here on, you’ll create a new journal per session.
    </p>
    <h3>Other Journal Creation Options</h3>
    <ul>
      <li>Press Alt+P (GM only) to create the next prep journal.</li>
    </ul>
    <pre><code>/prep</code></pre>
    <p>Type in chat to generate a new prep journal.</p>
    <h3>Module Settings</h3>
    <ul>
      <li>Separate Pages: Each step will have its own page. With it unchecked, all steps are combined into a single page. (Default – Enabled)</li>
      <li>Folder Name: Type the folder name you want journals to be created under. (Default – Lazy GM Prep)</li>
      <li>Journal Prefix: Type the journal name you want used. (Default – Session)</li>
      <li>Include Date: Appends the date to the name of the journal (Default – Enabled)</li>
      <li>Default rows in Characters and NPC pages: Allows you to start with a set number of rows. (Default – 5)</li>
      <li>Copy Previous: Each step can copy prior content or be toggled off if you don't want that page copied to the next journal. (Default – Enabled)</li>
    </ul>
    <h3>Good to Know</h3>
    <ul>
      <li>Secrets & Clues carry forward: Only unchecked secrets from the prior session are brought forward and topped up to 10.</li>
      <li>Editable Tables: Use the default Foundry table options on the Characters and NPC pages to add or remove rows or columns.</li>
      <li>Actors, NPCs, and other items: Drag and drop them into the “Review the Characters” table for one-click access to their character sheets. Same for NPCs and other items.</li>
    </ul>
    <p>
      <button type="button" class="lgmp-settings-btn" data-lazy-open-settings>
        <i class="fa fa-gear" style="margin-right:4px;"></i> Open Module Settings
      </button>
    </p>
  `.trim() + "\n";
}

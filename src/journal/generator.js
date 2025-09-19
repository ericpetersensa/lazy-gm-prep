// src/journal/generator.js
import { MODULE_ID, SETTINGS } from "../constants.js";
import { PAGE_ORDER, getSetting } from "../settings.js";

/** ...other code unchanged... **/

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
}

/** Characters table & prompts **/
function characterReviewTableHTML(rowCount = 5) {
  const headers = [
    game.i18n.localize("lazy-gm-prep.characters.table.header.pcName"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.player"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.conceptRole"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.goalHook"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.bondDrama"),
    game.i18n.localize("lazy-gm-prep.characters.table.header.recentNote")
  ].map(escapeHtml);
  const cols = headers.length;
  const bodyRows = Array.from({ length: rowCount }, () =>
    `<tr>${"<td></td>".repeat(cols)}</tr>`
  ).join("\n");
  return `
<table class="lgmp-char-table lgmp-char-table--compact">
  <thead>
    <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
  </thead>
  <tbody>
${bodyRows}
  </tbody>
</table>
`.trim() + "\n";
}

/** ...rest of file unchanged except: **/

// In the page generation logic for "review-characters", replace hardcoded 5 with the setting:
const initialRows = Number(getSetting("initialCharacterRows", 5)) || 5;
// Use initialRows in characterReviewTableHTML(initialRows)

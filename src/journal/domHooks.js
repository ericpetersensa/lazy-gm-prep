
// src/journal/domHooks.js
import { MODULE_ID } from '../constants.js';

export function ensureClickCSS() {
  if (document.getElementById(`${MODULE_ID}-toggle-style`)) return;
  const style = document.createElement("style");
  style.id = `${MODULE_ID}-toggle-style`;
  style.textContent = `
    ul.lgmp-checklist li { cursor: pointer; user-select: none; }
    ul.lgmp-checklist li:active { opacity: .85; }
  `;
  document.head.appendChild(style);
}

/**
 * Persisted toggle for ☑/☐ on checklist items.
 * - Works for Secrets & Clues (ul.lgmp-checklist) and Scenes (li[data-marker="scene-done"] inside a card).
 * - In view mode, clicking updates the page's saved HTML so the change survives re-render.
 */
export function enableChecklistToggle() {
  document.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    // Only act on <li> inside a .lgmp-checklist
    if (!target.matches("ul.lgmp-checklist li")) return;

    // Find the surrounding journal page element to get the page id (v13 text page markup includes data-page-id)
    const pageHost = target.closest('[data-page-id]');
    const pageId = pageHost?.getAttribute('data-page-id');
    if (!pageId) return;

    // Resolve the JournalEntryPage document
    // Try to get the sheet's document via ApplicationV2 context (pageHost is rendered inside a sheet)
    const appEl = pageHost.closest('[data-app-id]');
    const appId = appEl?.getAttribute('data-app-id');
    let pageDoc = null;

    // Attempt to locate the sheet instance and its page document
    try {
      const app = appId ? ui.windows?.[Number(appId)] : null;
      const entry = app?.document; // JournalEntry
      pageDoc = entry?.pages?.get(pageId);
    } catch { /* noop */ }

    // Fallback: search all open journal sheets
    if (!pageDoc) {
      for (const w of Object.values(ui.windows ?? {})) {
        const entry = w?.document;
        const candidate = entry?.pages?.get?.(pageId);
        if (candidate) { pageDoc = candidate; break; }
      }
    }
    if (!pageDoc) return;

    const currentHtml = String(pageDoc.text?.content ?? "");
    // Create a temporary DOM to mutate the marker reliably
    const doc = new DOMParser().parseFromString(currentHtml, "text/html");

    // Find the corresponding LI in the saved HTML: prefer the one with the same marker attribute if present
    // For scenes we tagged <li data-marker="scene-done">... Done</li>
    // For clues it may not have data-marker; we match the first LI under the same UL order as click target
    let liToToggle = null;

    // If clicked LI has a data-marker, try to toggle by attribute match within the same card
    const marker = target.getAttribute('data-marker');
    if (marker) {
      // Narrow to the corresponding card in saved HTML by index
      // Strategy: find all cards, then all LI[data-marker="scene-done"] and map click index
      const clickedCard = target.closest('.lgmp-scene');
      const cardsRendered = Array.from(pageHost.querySelectorAll('.lgmp-scene'));
      const cardIndex = cardsRendered.indexOf(clickedCard);

      const cardsSaved = Array.from(doc.querySelectorAll('.lgmp-scene'));
      const savedCard = cardsSaved[cardIndex];
      liToToggle = savedCard?.querySelector(`ul.lgmp-checklist li[data-marker="${marker}"]`) ?? null;
    }

    // Fallback for generic checklists (Secrets & Clues): toggle the LI by list index
    if (!liToToggle) {
      const clickedUl = target.closest('ul.lgmp-checklist');
      const renderedLis = Array.from(clickedUl.querySelectorAll('li'));
      const liIndex = renderedLis.indexOf(target);

      const ulsSaved = Array.from(doc.querySelectorAll('ul.lgmp-checklist'));
      // Choose the UL in saved HTML that matches the same structural position within the page
      // (best-effort: pick the first UL whose textContent includes the same label)
      let savedUl = null;
      for (const ul of ulsSaved) {
        if (ul.textContent?.includes(target.textContent?.trim() ?? "")) { savedUl = ul; break; }
      }
      const savedLis = Array.from(savedUl?.querySelectorAll('li') ?? []);
      liToToggle = savedLis[liIndex] ?? null;
    }

    if (!liToToggle) return;

    const t = (liToToggle.textContent ?? "").trim();
    if (t.startsWith("☐")) liToToggle.textContent = t.replace(/^☐/, "☑");
    else if (t.startsWith("☑")) liToToggle.textContent = t.replace(/^☑/, "☐");

    // Persist the updated HTML back to the page
    const newHtml = doc.body.innerHTML;
    await pageDoc.update({ text: { content: newHtml } });
  });
}

/** Initialize hooks once */
export function initDomHooks() {
  ensureClickCSS();
  enableChecklistToggle();
}

Hooks.on("ready", () => {
  initDomHooks();
});

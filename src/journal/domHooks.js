
// src/journal/domHooks.js
import { MODULE_ID } from '../constants.js';

/**
 * Inject minimal CSS for checklist interactivity.
 */
export function ensureClickCSS() {
  if (document.getElementById(`${MODULE_ID}-toggle-style`)) return;

  const style = document.createElement("style");
  style.id = `${MODULE_ID}-toggle-style`;
  style.textContent = `
    ul.lgmp-checklist li {
      cursor: pointer;
      user-select: none;
    }
    ul.lgmp-checklist li:active {
      opacity: .85;
    }
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

    // Only act on checklist items
    if (!target.matches("ul.lgmp-checklist li")) return;

    // Locate the page container to get the JournalEntryPage id (v13 markup includes data-page-id)
    const pageHost = target.closest('[data-page-id]');
    const pageId = pageHost?.getAttribute('data-page-id');
    if (!pageId) return;

    // Try to resolve the JournalEntryPage via ApplicationV2 context
    const appEl = pageHost.closest('[data-app-id]');
    const appId = appEl?.getAttribute('data-app-id');
    let pageDoc = null;

    try {
      const app = appId ? ui.windows?.[Number(appId)] : null;
      const entry = app?.document; // JournalEntry
      pageDoc = entry?.pages?.get(pageId);
    } catch {
      /* noop */
    }

    // Fallback: search all open journal sheets
    if (!pageDoc) {
      for (const w of Object.values(ui.windows ?? {})) {
        const entry = w?.document;
        const candidate = entry?.pages?.get?.(pageId);
        if (candidate) {
          pageDoc = candidate;
          break;
        }
      }
    }
    if (!pageDoc) return;

    const currentHtml = String(pageDoc.text?.content ?? "");

    // Mutate a temporary DOM
    const doc = new DOMParser().parseFromString(currentHtml, "text/html");

    // Find matching LI to toggle in the persisted HTML
    let liToToggle = null;

    // Prefer attribute-based match inside the same card when present
    const marker = target.getAttribute('data-marker');
    if (marker) {
      const clickedCard = target.closest('.lgmp-scene');
      const cardsRendered = Array.from(pageHost.querySelectorAll('.lgmp-scene'));
      const cardIndex = cardsRendered.indexOf(clickedCard);

      const cardsSaved = Array.from(doc.querySelectorAll('.lgmp-scene'));
      const savedCard = cardsSaved[cardIndex];

      liToToggle = savedCard?.querySelector(`ul.lgmp-checklist li[data-marker="${marker}"]`) ?? null;
    }

    // Fallback: toggle by list index
    if (!liToToggle) {
      const clickedUl = target.closest('ul.lgmp-checklist');
      const renderedLis = Array.from(clickedUl.querySelectorAll('li'));
      const liIndex = renderedLis.indexOf(target);

      const ulsSaved = Array.from(doc.querySelectorAll('ul.lgmp-checklist'));
      // Best-effort: choose UL whose text includes the same label
      let savedUl = null;
      for (const ul of ulsSaved) {
        if (ul.textContent?.includes(target.textContent?.trim() ?? "")) {
          savedUl = ul;
          break;
        }
      }
      const savedLis = Array.from(savedUl?.querySelectorAll('li') ?? []);
      liToToggle = savedLis[liIndex] ?? null;
    }

    if (!liToToggle) return;

    const t = (liToToggle.textContent ?? "").trim();
    if (t.startsWith("☐")) liToToggle.textContent = t.replace(/^☐/, "☑");
    else if (t.startsWith("☑")) liToToggle.textContent = t.replace(/^☑/, "☐");

    // Persist the updated HTML back to the page, preserving HTML format
    const newHtml = doc.body.innerHTML;
    await pageDoc.update({ text: { content: newHtml, format: CONST.TEXT_FORMAT_HTML } });
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

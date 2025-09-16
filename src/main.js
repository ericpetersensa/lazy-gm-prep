// src/main.js
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

/* =========================================
   Toggle debug tracing here if needed
========================================= */
const DEBUG = false;
const log = (...a) => DEBUG && console.debug(`${MODULE_ID} |`, ...a);

/* ========================================================================== */
/* Create GM Prep: Header button (AppV2 & v13+)                                */
/* ========================================================================== */
function ensureInlineHeaderButton(rootEl) {
  if (!game.user.isGM) return;
  const header = rootEl.querySelector(".directory-header");
  if (!header) return;

  const container =
    header.querySelector(".action-buttons") ||
    header.querySelector(".header-actions") ||
    header.querySelector(".header-controls") ||
    header;

  if (container.querySelector('[data-action="lazy-gm-prep-inline"]')) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.action = "lazy-gm-prep-inline";
  btn.classList.add("lazy-gm-prep-btn", "header-control", "create-entry");
  btn.title = game.i18n.localize("lazy-gm-prep.header.buttonTooltip");
  btn.innerHTML = `<i class="fa-solid fa-clipboard-list"></i> ${game.i18n.localize("lazy-gm-prep.header.button")}`;
  btn.addEventListener("click", () => createPrepJournal());
  container.appendChild(btn);
}

Hooks.on("renderJournalDirectory", (_app, html) => {
  const root = html?.[0] ?? html;
  if (root) ensureInlineHeaderButton(root);
});

/* ========================================================================== */
/* Checklist: View-mode toggle (☐ ⇄ ☑) with immediate persistence             */
/* ========================================================================== */
/**
 * We must cope with AppV2 shadow DOM and dynamic re-renders.
 * Strategy:
 *  - Bind pointerdown directly to EVERY <li> under any open shadow root (deep traversal).
 *  - ALSO capture pointerdown at the sheet container AND document to catch composedPath() events.
 *  - On pointerdown, toggle the Unicode box in the LI, persist by replacing the checklist UL in the saved HTML, and re-render.
 */
Hooks.on("renderJournalPageSheet", (app, html) => {
  const sheetRoot = html?.[0] ?? html;
  if (!sheetRoot) return;

  // Only operate in VIEW mode (no editors)
  const isEditMode =
    sheetRoot.querySelector(".editor") ||
    sheetRoot.querySelector(".tox-tinymce") ||
    sheetRoot.querySelector('[contenteditable="true"]');
  if (isEditMode) {
    log("edit mode detected; skipping checklist binding");
    return;
  }

  const BOUND = Symbol.for(`${MODULE_ID}:boundChecklistLI`);
  const observers = [];

  const toggleMarker = (text) => {
    if (/^\s*☐/.test(text)) return text.replace(/^\s*☐/, "☑");
    if (/^\s*☑/.test(text)) return text.replace(/^\s*☑/, "☐");
    if (/^\s*\[\s*\]/.test(text)) return text.replace(/^\s*\[\s*\]/, "☑");
    if (/^\s*\[\s*[xX]\s*\]/.test(text)) return text.replace(/^\s*\[\s*[xX]\s*\]/, "☐");
    return `☐ ${text}`;
  };

  async function persistChecklistFromRenderedUL(ulEl) {
    try {
      const page = app?.page;
      if (!page) return;

      const newUL = ulEl.outerHTML;
      const oldContent = page.text?.content ?? "";

      const parser = new DOMParser();
      const doc = parser.parseFromString(oldContent, "text/html");
      const savedUL = doc.querySelector("ul.lgmp-checklist");

      let newContent;
      if (savedUL) {
        savedUL.outerHTML = newUL;
        newContent = doc.body.innerHTML;
      } else {
        newContent = `${oldContent}\n${newUL}`;
      }

      await page.update({ "text.content": newContent });
      app.render(true);
      log("persisted checklist");
    } catch (err) {
      console.error(`${MODULE_ID} | persist failed`, err);
    }
  }

  function handlePointerDown(ev, from = "direct") {
    // Use composedPath so we can see across shadow boundaries
    const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
    let li = null;
    let ul = null;

    if (path.length) {
      for (const n of path) {
        if (!li && n?.nodeType === 1 && n.matches?.("li")) li = n;
        if (!ul && n?.nodeType === 1 && n.matches?.("ul.lgmp-checklist")) ul = n;
        if (li && ul) break;
      }
    }
    if (!li || !ul) {
      // Fallback to standard DOM search
      const target = ev.target;
      li = target?.closest?.("li") || null;
      ul = target?.closest?.("ul.lgmp-checklist") || null;
    }

    if (!li || !ul) return;

    ev.preventDefault();
    ev.stopPropagation();

    const current = li.textContent ?? "";
    const next = toggleMarker(current);
    li.textContent = next;

    persistChecklistFromRenderedUL(ul);
    log(`toggle (${from})`, { current, next });
  }

  // --------- Direct binding on each <li> (deep traversal including shadow roots)
  function* deepNodes(start) {
    const stack = [start];
    while (stack.length) {
      const n = stack.pop();
      yield n;
      if (n?.shadowRoot) stack.push(n.shadowRoot);
      // children
      if (n?.children) for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]);
    }
  }

  function bindDirect() {
    let count = 0;
    for (const n of deepNodes(sheetRoot)) {
      if (!n?.querySelectorAll) continue;
      const lis = n.querySelectorAll("ul.lgmp-checklist li");
      lis.forEach((li) => {
        if (li[BOUND]) return;
        li.addEventListener("pointerdown", (ev) => handlePointerDown(ev, "li"), { capture: true });
        li[BOUND] = true;
        count++;
      });
      // Also bind if we can access this node's shadowRoot directly
      if (n.shadowRoot?.querySelectorAll) {
        const lisSR = n.shadowRoot.querySelectorAll("ul.lgmp-checklist li");
        lisSR.forEach((li) => {
          if (li[BOUND]) return;
          li.addEventListener("pointerdown", (ev) => handlePointerDown(ev, "li-sr"), { capture: true });
          li[BOUND] = true;
          count++;
        });
      }
    }
    log("direct-bound checklist LIs:", count);
  }

  // MutationObserver to re-bind if the component re-renders / swaps its internals
  function observe(root) {
    const mo = new MutationObserver(() => bindDirect());
    mo.observe(root, { childList: true, subtree: true });
    observers.push(mo);
  }

  bindDirect();
  observe(sheetRoot);

  // --------- Safety nets: capture at sheetRoot and document using composedPath
  const captureHandler = (ev) => handlePointerDown(ev, "capture");
  sheetRoot.addEventListener("pointerdown", captureHandler, true);
  document.addEventListener("pointerdown", captureHandler, true);

  // Cleanup when the sheet closes
  const appEl = sheetRoot.closest?.(".app");
  if (appEl) {
    const cleanup = () => {
      observers.forEach((o) => o.disconnect());
      sheetRoot.removeEventListener("pointerdown", captureHandler, true);
      document.removeEventListener("pointerdown", captureHandler, true);
      log("cleanup complete");
    };
    appEl.addEventListener("closed", cleanup, { once: true });
  }
});

/* ========================================================================== */
/* Module init / ready / commands / keybindings                               */
/* ========================================================================== */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();

  // Keybinding: Alt+P (GM) -> Create Prep journal
  game.keybindings.register(MODULE_ID, "create-prep", {
    name: "lazy-gm-prep.keybindings.createPrep.name",
    hint: "lazy-gm-prep.keybindings.createPrep.hint",
    editable: [{ key: "KeyP", modifiers: ["Alt"] }],
    onDown: () => {
      if (!game.user.isGM) return false;
      createPrepJournal();
      return true;
    },
    restricted: true
  });
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
  ui.journal?.render(true);
});

// Chat command: /prep -> Create Prep (GM only)
Hooks.on("chatMessage", (_chatLog, text) => {
  if (!game.user.isGM) return;
  if (text.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false;
  }
});

// src/main.js
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

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
 * AppV2 uses Shadow DOM inside page components. To guarantee clicks are seen,
 * we bind directly to each <li> inside any <ul.lgmp-checklist>, including those
 * inside nested shadowRoots, and we also observe the sheet for dynamic changes.
 */

Hooks.on("renderJournalPageSheet", (app, html) => {
  const sheetRoot = html?.[0] ?? html;
  if (!sheetRoot) return;

  // Only operate in VIEW mode; skip if an editor is present.
  const isEditMode =
    sheetRoot.querySelector(".editor") ||
    sheetRoot.querySelector(".tox-tinymce") ||
    sheetRoot.querySelector('[contenteditable="true"]');
  if (isEditMode) return;

  // --- Bind logic -----------------------------------------------------------
  const boundSymbol = Symbol.for(`${MODULE_ID}:boundClick`);
  const observers = [];

  /** Toggle the leading checkbox marker (Unicode or legacy brackets). */
  function toggleMarker(text) {
    if (/^\s*☐/.test(text)) return text.replace(/^\s*☐/, "☑");
    if (/^\s*☑/.test(text)) return text.replace(/^\s*☑/, "☐");
    if (/^\s*\[\s*\]/.test(text)) return text.replace(/^\s*\[\s*\]/, "☑");   // [ ] -> ☑
    if (/^\s*\[\s*[xX]\s*\]/.test(text)) return text.replace(/^\s*\[\s*[xX]\s*\]/, "☐"); // [x] -> ☐
    return `☐ ${text}`;
  }

  /** Persist the currently rendered checklist UL back into the page document. */
  async function persistChecklistFromRenderedUL(ulEl) {
    try {
      const page = app?.page; // JournalEntryPage document
      if (!page) return;

      const newUL = ulEl.outerHTML;
      const oldContent = page.text?.content ?? "";

      // Parse saved HTML; replace the first lgmp-checklist UL found.
      const parser = new DOMParser();
      const doc = parser.parseFromString(oldContent, "text/html");
      const savedUL = doc.querySelector("ul.lgmp-checklist");

      let newContent;
      if (savedUL) {
        savedUL.outerHTML = newUL;
        newContent = doc.body.innerHTML;
      } else {
        // Safety: append if somehow missing in saved content
        newContent = `${oldContent}\n${newUL}`;
      }

      await page.update({ "text.content": newContent });
      app.render(true);
    } catch (err) {
      console.error(`${MODULE_ID} | Checklist toggle persist failed:`, err);
    }
  }

  /** Click handler bound directly on each <li>. */
  function onChecklistClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    const li = ev.currentTarget;
    if (!li) return;

    // Flip the marker in the live DOM immediately
    const next = toggleMarker(li.textContent ?? "");
    li.textContent = next;

    // Persist: find the enclosing UL and save it back into the page HTML.
    const ul = li.closest("ul.lgmp-checklist");
    if (ul) persistChecklistFromRenderedUL(ul);
  }

  /** Recursively collect all nodes (including shadowRoots) under a root. */
  function* traverseDeep(rootNode) {
    const stack = [rootNode];
    while (stack.length) {
      const n = stack.pop();
      yield n;
      // Shadow root
      if (n && n.shadowRoot) stack.push(n.shadowRoot);
      // Regular children
      if (n && n.children) {
        for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]);
      }
    }
  }

  /** Bind click handlers to all current checklist LIs under a given root (deep). */
  function bindAllChecklistLis(rootNode) {
    for (const n of traverseDeep(rootNode)) {
      if (n?.querySelectorAll) {
        const lis = n.querySelectorAll("ul.lgmp-checklist li");
        lis.forEach((li) => {
          // Avoid double-binding
          if (li[boundSymbol]) return;
          li.addEventListener("click", onChecklistClick, { capture: true });
          li[boundSymbol] = true;
        });
      }
    }
  }

  /** Observe for new/changed content and (re)bind as needed. */
  function observeMutations(rootNode) {
    const mo = new MutationObserver((mutList) => {
      for (const m of mutList) {
        // If a checklist UL or LI is added/changed, (re)bind within that subtree
        if (
          (m.addedNodes && m.addedNodes.length) ||
          m.type === "childList" ||
          (m.target && (m.target.matches?.("ul.lgmp-checklist, ul.lgmp-checklist li") ||
                        m.target.closest?.("ul.lgmp-checklist")))
        ) {
          bindAllChecklistLis(rootNode);
        }
      }
    });
    mo.observe(rootNode, { childList: true, subtree: true });
    observers.push(mo);
  }

  // Initial bind across light DOM + any shadowRoots
  bindAllChecklistLis(sheetRoot);

  // Observe the sheet root itself
  observeMutations(sheetRoot);

  // Also observe any shadow host we can reach from the sheet root
  for (const el of sheetRoot.querySelectorAll("*")) {
    if (el.shadowRoot) {
      bindAllChecklistLis(el.shadowRoot);
      observeMutations(el.shadowRoot);
    }
  }

  // When the sheet closes, disconnect observers (Foundry will destroy this DOM)
  const appEl = sheetRoot.closest?.(".app");
  if (appEl) {
    const disconnect = () => observers.forEach((o) => o.disconnect());
    appEl.addEventListener("closed", disconnect, { once: true });
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

// src/main.js
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

/* =======================================================================================
   Create GM Prep: Header button (AppV2 & v13+)
======================================================================================= */
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

/* =======================================================================================
   VIEW-MODE SECRETS PANEL (works around closed Shadow DOM)
   - Adds a small floating button on Journal Page Sheet (view mode only) when a checklist exists.
   - Clicking it opens a panel that lists the current ☐/☑ items; clicking an item toggles & saves.
======================================================================================= */

/** Normalize old markers to Unicode ☐/☑ */
function normalizeMarkers(html) {
  let s = String(html ?? "");
  // inputs -> markers
  s = s.replace(/<input[^>]*type=["']checkbox["'][^>]*checked[^>]*>/gi, "☑");
  s = s.replace(/<input[^>]*type=["']checkbox["'][^>]*>/gi, "☐");
  // bracket -> markers
  s = s.replace(/\[\s*\]/g, "☐");
  s = s.replace(/\[\s*[xX]\s*\]/g, "☑");
  // unwrap labels
  s = s.replace(/<label[^>]*>/gi, "").replace(/<\/label>/gi, "");
  return s;
}

/** Extract the module checklist: returns { bodyWithoutChecklist, ulHtml, items: [{text,checked}] } */
function extractChecklist(html) {
  const UL_RE = /<ul\s+class=["']lgmp-checklist["'][\s\S]*?<\/ul>/i;
  const hit = html.match(UL_RE);
  if (!hit) return { bodyWithoutChecklist: html, ulHtml: "", items: [] };
  const ulHtml = hit[0];
  const bodyWithoutChecklist = html.replace(UL_RE, "");
  const items = [];
  // pull <li> text
  const LI_RE = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = LI_RE.exec(ulHtml))) {
    const raw = m[1].replace(/<\/?[^>]+>/g, "").trim(); // strip tags
    if (!raw) continue;
    const checked = /^\s*☑/.test(raw);
    const text = raw.replace(/^\s*[☐☑]\s*/, "");
    items.push({ text, checked });
  }
  return { bodyWithoutChecklist, ulHtml, items };
}

/** Build UL HTML from {text,checked}[] (always Unicode) */
function buildChecklist(items) {
  const lis = items.map(i => `<li>${i.checked ? "☑" : "☐"} ${escapeHtml(i.text)}</li>`).join("\n");
  return `<ul class="lgmp-checklist">\n${lis}\n</ul>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
}

/** Create the floating button & panel for a given sheet container */
function injectSecretsPanel(app, sheetRoot) {
  // Only in view-mode (not editing)
  const isEditMode =
    sheetRoot.querySelector(".editor") ||
    sheetRoot.querySelector(".tox-tinymce") ||
    sheetRoot.querySelector('[contenteditable="true"]');
  if (isEditMode) return;

  const page = app?.page;
  if (!page) return;

  // Determine if page has a checklist block
  const saved = String(page.text?.content ?? "");
  const normalized = normalizeMarkers(saved);
  const { items, ulHtml } = extractChecklist(normalized);
  if (!ulHtml) return; // Nothing to manage on this page

  // Ensure the .app container is positioned to host the overlay
  const appEl = sheetRoot.closest(".app");
  if (!appEl) return;
  appEl.classList.add("lgmp-app-host"); // CSS sets position:relative if needed

  // Avoid duplicates if re-rendering
  if (appEl.querySelector(".lgmp-secrets-fab")) return;

  // Floating action button
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "lgmp-secrets-fab";
  fab.title = "Toggle Secrets & Clues (view mode)";
  fab.innerHTML = "☰ Secrets";

  // Panel
  const panel = document.createElement("div");
  panel.className = "lgmp-secrets-panel";
  panel.setAttribute("hidden", "hidden");

  // Build panel content
  const header = document.createElement("div");
  header.className = "lgmp-secrets-panel__header";
  header.innerHTML = `<strong>Secrets & Clues</strong><button type="button" class="lgmp-secrets-close" title="Close">×</button>`;

  const list = document.createElement("ul");
  list.className = "lgmp-secrets-panel__list";

  // Build items from saved HTML
  items.forEach((it, idx) => {
    const li = document.createElement("li");
    li.dataset.index = String(idx);
    li.innerHTML = `<button type="button" class="lgmp-secret-toggle">${it.checked ? "☑" : "☐"}</button><span class="lgmp-secret-text">${escapeHtml(it.text)}</span>`;
    list.appendChild(li);
  });

  // Assemble
  panel.appendChild(header);
  panel.appendChild(list);
  appEl.appendChild(fab);
  appEl.appendChild(panel);

  // Events
  fab.addEventListener("click", () => {
    const isHidden = panel.hasAttribute("hidden");
    if (isHidden) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "hidden");
  });
  panel.querySelector(".lgmp-secrets-close")?.addEventListener("click", () => {
    panel.setAttribute("hidden", "hidden");
  });

  // Toggle handler (click on a line)
  panel.addEventListener("click", async (ev) => {
    const btn = ev.target?.closest?.(".lgmp-secret-toggle");
    if (!btn) return;
    const lineEl = btn.closest("li");
    const idx = Number(lineEl?.dataset?.index ?? -1);
    if (idx < 0) return;

    // Flip marker in panel UI
    const currentlyChecked = btn.textContent?.trim() === "☑";
    btn.textContent = currentlyChecked ? "☐" : "☑";

    // Build new checklist array from panel
    const currentItems = Array.from(panel.querySelectorAll(".lgmp-secrets-panel__list > li")).map(li => {
      return {
        text: li.querySelector(".lgmp-secret-text")?.textContent ?? "",
        checked: (li.querySelector(".lgmp-secret-toggle")?.textContent?.trim() === "☑")
      };
    });

    // Persist back into the page’s HTML by replacing the first lgmp-checklist
    try {
      const oldContent = String(page.text?.content ?? "");
      const parser = new DOMParser();
      const doc = parser.parseFromString(normalizeMarkers(oldContent), "text/html");
      const ul = doc.querySelector("ul.lgmp-checklist");
      if (ul) {
        ul.outerHTML = buildChecklist(currentItems);
      } else {
        // Safety: append at end if somehow missing
        doc.body.insertAdjacentHTML("beforeend", buildChecklist(currentItems));
      }
      const newHtml = doc.body.innerHTML;
      await page.update({ "text.content": newHtml });
      // Re-render the sheet so in-page view also updates
      app.render(true);
    } catch (err) {
      console.error(`${MODULE_ID} | Failed to persist Secrets toggle:`, err);
    }
  });
}

// Attach the overlay only when a checklist exists and only in view mode
Hooks.on("renderJournalPageSheet", (app, html) => {
  const root = html?.[0] ?? html;
  if (!root) return;
  injectSecretsPanel(app, root);
});

/* =======================================================================================
   Module init / ready / commands / keybindings
======================================================================================= */
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

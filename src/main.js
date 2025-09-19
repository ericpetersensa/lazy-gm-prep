// src/main.js
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

/* =======================================================================================
 Constants & State
======================================================================================= */
const SECRETS_PAGE_NAME = "4. Define Secrets & Clues"; // exact title (case-insensitive)
const CURRENT_PAGE_BY_ENTRY = new Map(); // entryId -> current pageId (for direct toggle)

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
  // One-click: use your generator (it already finds previous/highest session; no prompt)
  btn.addEventListener("click", () => createPrepJournal());
  container.appendChild(btn);
}
Hooks.on("renderJournalDirectory", (_app, html) => {
  const root = html?.[0] ?? html;
  if (root) ensureInlineHeaderButton(root);
});

/* =======================================================================================
 Shared HTML utilities (normalize, extract, build)
======================================================================================= */
function normalizeMarkers(html) {
  let s = String(html ?? "");
  // inputs -> unicode boxes
  s = s.replace(/\<input[^\>]*type=['"]checkbox['"][^\>]*checked[^\>]*\>/gi, "☑");
  s = s.replace(/\<input[^\>]*type=['"]checkbox['"][^\>]*\>/gi, "☐");
  // bracket -> unicode
  s = s.replace(/\[\s*\]/g, "☐");
  s = s.replace(/\[\s*[xX]\s*\]/g, "☑");
  // unwrap labels
  s = s.replace(/\<label[^\>]*\>/gi, "").replace(/\<\/label\>/gi, "");
  return s;
}
function extractChecklist(html) {
  const UL_RE = /\<ul\s+class=['"]lgmp-checklist['"][\s\S]*?\<\/ul\>/i;
  const hit = html.match(UL_RE);
  if (!hit) return { bodyWithoutChecklist: html, ulHtml: "", items: [] };
  const ulHtml = hit[0];
  const bodyWithoutChecklist = html.replace(UL_RE, "");
  const items = [];
  const LI_RE = /\<li[^\>]*\>([\s\S]*?)\<\/li\>/gi;
  let m;
  while ((m = LI_RE.exec(ulHtml))) {
    const raw = m[1].replace(/\<\/?[^>]+\>/g, "").trim();
    if (!raw) continue;
    const checked = /^\s*☑/.test(raw);
    const text = raw.replace(/^\s*[☐☑]\s*/, "");
    items.push({ text, checked });
  }
  return { bodyWithoutChecklist, ulHtml, items };
}
function buildChecklist(items) {
  const lis = items
    .map(i => `<li>${i.checked ? "☑" : "☐"} ${escapeHtml(i.text)}</li>`)
    .join("\n");
  return `<ul class="lgmp-checklist">\n${lis}\n</ul>`;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>\"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

/* =======================================================================================
 Overlay Panel (☰ Secrets) — view mode helper (optional UI)
======================================================================================= */
function injectSecretsPanel(app, sheetRoot) {
  // Only when not editing
  const isEditMode =
    sheetRoot.querySelector(".editor") ||
    sheetRoot.querySelector(".tox-tinymce") ||
    sheetRoot.querySelector('[contenteditable="true"]');
  if (isEditMode) return;

  // Track current page -> entry (used by direct toggle)
  try {
    const pg = app?.page;
    const entryId = pg?.parent?.id;
    if (pg?.id && entryId) CURRENT_PAGE_BY_ENTRY.set(entryId, pg.id);
  } catch (_) {}

  const page = app?.page;
  if (!page) return;

  const saved = String(page.text?.content ?? "");
  const normalized = normalizeMarkers(saved);
  const { items, ulHtml } = extractChecklist(normalized);
  if (!ulHtml) return;

  const appEl = sheetRoot.closest(".app");
  if (!appEl) return;
  if (appEl.querySelector(".lgmp-secrets-fab")) return; // avoid duplicates
  appEl.classList.add("lgmp-app-host");

  // FAB
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "lgmp-secrets-fab";
  fab.title = "Toggle Secrets & Clues (view mode)";
  fab.innerHTML = "☰ Secrets";

  // Panel
  const panel = document.createElement("div");
  panel.className = "lgmp-secrets-panel";
  panel.setAttribute("hidden", "hidden");
  const header = document.createElement("div");
  header.className = "lgmp-secrets-panel__header";
  header.innerHTML = `<strong>Secrets & Clues</strong><button type="button" class="lgmp-secrets-close" title="Close">×</button>`;
  const list = document.createElement("ul");
  list.className = "lgmp-secrets-panel__list";
  items.forEach((it, idx) => {
    const li = document.createElement("li");
    li.dataset.index = String(idx);
    li.innerHTML = `<button type="button" class="lgmp-secret-toggle">${it.checked ? "☑" : "☐"}</button><span class="lgmp-secret-text">${escapeHtml(it.text)}</span>`;
    list.appendChild(li);
  });
  panel.appendChild(header);
  panel.appendChild(list);
  appEl.appendChild(fab);
  appEl.appendChild(panel);

  fab.addEventListener("click", () => {
    panel.toggleAttribute("hidden");
  });
  panel.querySelector(".lgmp-secrets-close")?.addEventListener("click", () => {
    panel.setAttribute("hidden", "hidden");
  });

  // Persist toggles from panel -> Document
  panel.addEventListener("click", async (ev) => {
    const btn = ev.target?.closest?.(".lgmp-secret-toggle");
    if (!btn) return;
    btn.textContent = (btn.textContent?.trim() === "☑") ? "☐" : "☑";
    const currentItems = Array.from(panel.querySelectorAll(".lgmp-secrets-panel__list > li")).map(li => ({
      text: li.querySelector(".lgmp-secret-text")?.textContent ?? "",
      checked: (li.querySelector(".lgmp-secret-toggle")?.textContent?.trim() === "☑")
    }));
    try {
      const oldContent = String(page.text?.content ?? "");
      const doc = new DOMParser().parseFromString(normalizeMarkers(oldContent), "text/html");
      const ul = doc.querySelector("ul.lgmp-checklist");
      if (ul) ul.outerHTML = buildChecklist(currentItems);
      else doc.body.insertAdjacentHTML("beforeend", buildChecklist(currentItems));
      await page.update({ "text.content": doc.body.innerHTML });
      app.render(true);
    } catch (err) {
      console.error(`${MODULE_ID} Failed to persist Secrets toggle:`, err);
      ui.notifications?.error("Failed to save Secrets changes.");
    }
  });
}

/* =======================================================================================
 Direct Click-to-Toggle in the rendered page (no overlay)
======================================================================================= */
function ensureClickCSS() {
  if (document.getElementById(`${MODULE_ID}-toggle-style`)) return;
  const style = document.createElement("style");
  style.id = `${MODULE_ID}-toggle-style`;
  style.textContent = `
 ul.lgmp-checklist li { cursor: pointer; user-select: none; }
 ul.lgmp-checklist li:active { opacity: .85; }
 `;
  document.head.appendChild(style);
}
function looksLikeSecrets(name) {
  return !!name && String(name).trim().toLowerCase() === SECRETS_PAGE_NAME.toLowerCase();
}
function hasChecklistHTML(html) {
  return String(html ?? "").includes('class="lgmp-checklist"');
}
function entryFromHost(host) {
  if (!host) return null;
  const dataId = host.dataset?.documentId || host.dataset?.entryId;
  let entry = dataId ? game.journal.get(dataId) : null;
  if (entry) return entry;
  const m = (host.id || "").match(/JournalEntry\-([A-Za-z0-9]{16,})/);
  const entryId = m?.[1] ?? null;
  return entryId ? game.journal.get(entryId) : null;
}
function bindDirectToggle(host) {
  if (!host || host.dataset.lgmpDirectToggleBound === "1") return;
  // Skip edit mode
  if (host.querySelector(".editor,.tox-tinymce,[contenteditable='true']")) return;
  host.dataset.lgmpDirectToggleBound = "1";
  host.addEventListener("click", async (ev) => {
    const li = ev.target?.closest?.("ul.lgmp-checklist li");
    if (!li) return;
    const entry = entryFromHost(host);
    if (!entry) return ui.notifications?.warn(`[${MODULE_ID}] Could not resolve JournalEntry.`);

    // Resolve the correct page
    let page = null;
    const currentId = CURRENT_PAGE_BY_ENTRY.get(entry.id);
    if (currentId) page = entry.pages?.get?.(currentId) || null;
    if (!page) page = entry.pages?.contents?.find(p => looksLikeSecrets(p.name)) || null;
    if (!page) page = entry.pages?.contents?.find(p => hasChecklistHTML(p.text?.content)) || null;
    if (!page) return ui.notifications?.warn(`[${MODULE_ID}] Cannot find "${SECRETS_PAGE_NAME}" on "${entry.name}".`);

    // Map clicked DOM item -> saved HTML item (UL index, LI index; fallback by text)
    const ulDom = li.closest("ul.lgmp-checklist");
    const allUlsDom = Array.from(host.querySelectorAll("ul.lgmp-checklist"));
    const ulIndex = Math.max(0, allUlsDom.indexOf(ulDom));
    const liIndex = Array.from(ulDom.querySelectorAll(":scope > li")).indexOf(li);

    try {
      const saved = normalizeMarkers(page.text?.content ?? "");
      const doc = new DOMParser().parseFromString(saved, "text/html");
      const allUlsSaved = doc.querySelectorAll("ul.lgmp-checklist");
      let ulSaved = allUlsSaved?.[ulIndex] || allUlsSaved?.[0] || null;
      if (!ulSaved) return ui.notifications?.warn(`[${MODULE_ID}] Saved HTML has no <ul class="lgmp-checklist">.`);
      let liSaved = ulSaved.querySelectorAll(":scope > li")?.[liIndex] || null;
      if (!liSaved) {
        const clickedText = (li.textContent || "").replace(/^\s*[☐☑]\s*/, "").trim();
        liSaved = Array.from(ulSaved.querySelectorAll(":scope > li"))
          .find(x => ((x.textContent || "").replace(/^\s*[☐☑]\s*/, "").trim() === clickedText)) || null;
      }
      if (!liSaved) return ui.notifications?.warn(`[${MODULE_ID}] Could not locate matching list item in saved HTML.`);
      const raw = (liSaved.textContent || "").trim();
      liSaved.textContent = raw.startsWith("☑") ? raw.replace(/^☑/, "☐") : raw.replace(/^[☐]?/, "☑");
      await page.update({ "text.content": doc.body.innerHTML });
      page.parent?.sheet?.render?.(true);
    } catch (err) {
      console.error(`[${MODULE_ID}] Toggle failed`, err);
      ui.notifications?.error(`[${MODULE_ID}] Toggle failed (see console).`);
    }
  }, true);
}

/* === Tiny addition: bind "Open Module Settings" links in pages/sections ============ */
function bindOpenSettings(host) {
  if (!host) return;
  const link = host.querySelector("[data-lazy-open-settings]");
  if (!link || link.dataset.bound === "1") return;
  link.dataset.bound = "1";
  link.addEventListener("click", (ev) => {
    ev.preventDefault();
    game.settings.sheet?.render(true);
  });
}

/* capture current page per entry */
Hooks.on("renderJournalPageSheet", (app, html) => {
  try {
    const pg = app?.page;
    const entryId = pg?.parent?.id;
    if (pg?.id && entryId) CURRENT_PAGE_BY_ENTRY.set(entryId, pg.id);
  } catch (_) {}
});

/* bind for existing/future sheets */
Hooks.on("ready", () => {
  ensureClickCSS();
  document.querySelectorAll("form.journal-sheet").forEach(host => {
    bindDirectToggle(host);
    bindOpenSettings(host); // NEW
  });
});
Hooks.on("renderApplicationV2", (_app, el) => {
  if (el?.classList?.contains?.("journal-sheet")) {
    bindDirectToggle(el);
    bindOpenSettings(el); // NEW
  }
});

/* =======================================================================================
 Module init / keybinding / chat command
======================================================================================= */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} init`);
  registerSettings();

  // Alt+P (GM): Create Prep (no prompt; generator uses highest/previous session)
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
  console.log(`${MODULE_ID} ready`);
  ui.journal?.render(true);
});
Hooks.on("chatMessage", (_chatLog, text) => {
  if (!game.user.isGM) return;
  if (text.trim().toLowerCase() === "/prep") {
    createPrepJournal();
    return false;
  }
});

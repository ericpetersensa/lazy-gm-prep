// src/main.js
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";
import { createPrepJournal } from "./journal/generator.js";

/* =======================================================================================
   LGMP+ constants & state
======================================================================================= */
const SECRETS_PAGE_NAME = "4. Define Secrets & Clues";              // <— single required title
/** Remember the most recently rendered Journal page per Entry (for toggling). */
const CURRENT_PAGE_BY_ENTRY_ID = new Map();

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
  // Call the smart wrapper so the Secrets page is filtered to ☐ items
  btn.addEventListener("click", () => createPrepJournalSmart());
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
function normalizeMarkers(html) {
  let s = String(html ?? "");
  s = s.replace(/<input[^>]*type=['"]checkbox['"][^>]*checked[^>]*>/gi, "☑");
  s = s.replace(/<input[^>]*type=['"]checkbox['"][^>]*>/gi, "☐");
  s = s.replace(/\[\s*\]/g, "☐");
  s = s.replace(/\[\s*[xX]\s*\]/g, "☑");
  s = s.replace(/<label[^>]*>/gi, "").replace(/<\/label>/gi, "");
  return s;
}
function extractChecklist(html) {
  const UL_RE = /<ul\s+class=['"]lgmp-checklist['"][\s\S]*?<\/ul>/i;
  const hit = html.match(UL_RE);
  if (!hit) return { bodyWithoutChecklist: html, ulHtml: "", items: [] };
  const ulHtml = hit[0];
  const bodyWithoutChecklist = html.replace(UL_RE, "");
  const items = [];
  const LI_RE = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = LI_RE.exec(ulHtml))) {
    const raw = m[1].replace(/<\/?[^>]+>/g, "").trim();
    if (!raw) continue;
    const checked = /^\s*☑/.test(raw);
    const text = raw.replace(/^\s*[☐☑]\s*/, "");
    items.push({ text, checked });
  }
  return { bodyWithoutChecklist, ulHtml, items };
}
function buildChecklist(items) {
  const lis = items.map(i => `<li>${i.checked ? "☑" : "☐"} ${escapeHtml(i.text)}</li>`).join("\n");
  return `<ul class="lgmp-checklist">\n${lis}\n</ul>`;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>\"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
}
function injectSecretsPanel(app, sheetRoot) {
  const isEditMode =
    sheetRoot.querySelector(".editor") ||
    sheetRoot.querySelector(".tox-tinymce") ||
    sheetRoot.querySelector('[contenteditable="true"]');
  if (isEditMode) return;

  // Record "last viewed page" for this entry and persist last source hints
  try {
    const pageDoc = app?.page;
    const entryId = pageDoc?.parent?.id;
    if (pageDoc?.id && entryId) CURRENT_PAGE_BY_ENTRY_ID.set(entryId, pageDoc.id);
    if (pageDoc?.text?.content && (hasChecklistHTML(pageDoc.text.content) || looksLikeSecrets(pageDoc.name))) {
      game.settings.set(MODULE_ID, "lastSourceJournalId", entryId ?? "");
      game.settings.set(MODULE_ID, "lastSourcePageId", pageDoc.id ?? "");
    }
  } catch (_) {}

  const page = app?.page;
  if (!page) return;

  const saved = String(page.text?.content ?? "");
  const normalized = normalizeMarkers(saved);
  const { items, ulHtml } = extractChecklist(normalized);
  if (!ulHtml) return;

  const appEl = sheetRoot.closest(".app");
  if (!appEl) return;
  appEl.classList.add("lgmp-app-host");
  if (appEl.querySelector(".lgmp-secrets-fab")) return;

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "lgmp-secrets-fab";
  fab.title = "Toggle Secrets & Clues (view mode)";
  fab.innerHTML = "☰ Secrets";

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
    const isHidden = panel.hasAttribute("hidden");
    if (isHidden) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "hidden");
  });
  panel.querySelector(".lgmp-secrets-close")?.addEventListener("click", () => {
    panel.setAttribute("hidden", "hidden");
  });

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
      const parser = new DOMParser();
      const doc = parser.parseFromString(normalizeMarkers(oldContent), "text/html");
      const ul = doc.querySelector("ul.lgmp-checklist");
      if (ul) ul.outerHTML = buildChecklist(currentItems);
      else doc.body.insertAdjacentHTML("beforeend", buildChecklist(currentItems));

      await page.update({ "text.content": doc.body.innerHTML });
      app.render(true);
    } catch (err) {
      console.error(`${MODULE_ID} Failed to persist Secrets toggle:`, err);
    }
  });
}
Hooks.on("renderJournalPageSheet", (app, html) => {
  const root = html?.[0] ?? html;
  if (!root) return;
  injectSecretsPanel(app, root);
});

/* =======================================================================================
 Direct click-to-toggle in rendered page (no overlay; persists Document)
======================================================================================= */
function hasChecklistHTML(html) {
  return String(html ?? "").includes('class="lgmp-checklist"');
}
function looksLikeSecrets(name) {
  return !!name && String(name).trim().toLowerCase() === SECRETS_PAGE_NAME.toLowerCase();
}
function bindDirectToggle(host) {
  if (!host || host.dataset.lgmpDirectToggleBound === "1") return;
  if (host.querySelector(".editor,.tox-tinymce,[contenteditable='true']")) return;

  host.dataset.lgmpDirectToggleBound = "1";
  host.addEventListener("click", async (ev) => {
    const li = ev.target?.closest?.("ul.lgmp-checklist li");
    if (!li) return;

    const entry = resolveEntryFromHost(host);
    if (!entry) return ui.notifications?.warn(`[${MODULE_ID}] Could not resolve JournalEntry document.`);

    let page = null;
    const currentId = CURRENT_PAGE_BY_ENTRY_ID.get(entry.id);
    if (currentId) page = entry.pages?.get?.(currentId) || null;
    if (!page) page = entry.pages?.contents?.find(p => looksLikeSecrets(p.name)) || null;
    if (!page) page = entry.pages?.contents?.find(p => hasChecklistHTML(p.text?.content)) || null;
    if (!page) return ui.notifications?.warn(`[${MODULE_ID}] Cannot find "${SECRETS_PAGE_NAME}" page on "${entry.name}".`);

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
          .find(x => (x.textContent || "").replace(/^\s*[☐☑]\s*/, "").trim() === clickedText) || null;
      }
      if (!liSaved) return ui.notifications?.warn(`[${MODULE_ID}] Could not locate matching list item in saved HTML.`);

      const raw = (liSaved.textContent || "").trim();
      liSaved.textContent = raw.startsWith("☑") ? raw.replace(/^☑/, "☐") : raw.replace(/^[☐]?/, "☑");

      await page.update({ "text.content": doc.body.innerHTML });
      page.parent?.sheet?.render?.(true);
    } catch (err) {
      console.error(`${MODULE_ID}] Toggle failed`, err);
      ui.notifications?.error(`[${MODULE_ID}] Toggle failed (see console).`);
    }
  }, true);
}
function resolveEntryFromHost(host) {
  if (!host) return null;
  const dataId = host.dataset?.documentId || host.dataset?.entryId;
  let entry = dataId ? game.journal.get(dataId) : null;
  if (entry) return entry;
  const m = (host.id || "").match(/JournalEntry-([A-Za-z0-9]{16,})/);
  const entryId = m?.[1] ?? null;
  return entryId ? game.journal.get(entryId) : null;
}
Hooks.on("ready", () => {
  document.querySelectorAll("form.journal-sheet").forEach(bindDirectToggle);
});
Hooks.on("renderApplicationV2", (_app, el) => {
  if (el?.classList?.contains?.("journal-sheet")) bindDirectToggle(el);
});

/* =======================================================================================
 Module init / ready / commands / keybindings
======================================================================================= */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} init`);
  registerSettings();

  // Client settings for last source (used by /prep wrapper)
  game.settings.register(MODULE_ID, "lastSourceJournalId", { scope: "client", config: false, type: String, default: "" });
  game.settings.register(MODULE_ID, "lastSourcePageId",   { scope: "client", config: false, type: String, default: "" });

  // Keybinding: Alt+P (GM) -> Create Prep journal (wrapper)
  game.keybindings.register(MODULE_ID, "create-prep", {
    name: "lazy-gm-prep.keybindings.createPrep.name",
    hint: "lazy-gm-prep.keybindings.createPrep.hint",
    editable: [{ key: "KeyP", modifiers: ["Alt"] }],
    onDown: () => { if (!game.user.isGM) return false; createPrepJournalSmart(); return true; },
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
    createPrepJournalSmart();
    return false;
  }
});

/* =======================================================================================
 Create GM Prep wrapper
 - Keeps your creation flow, but ensures the Secrets page in the NEW journal only has ☐ items
   copied from the SOURCE journal's Secrets page (exact name "4. Define Secrets & Clues").
======================================================================================= */
async function createPrepJournalSmart() {
  try {
    let postProcessPending = true;
    const hookId = Hooks.on("createJournalEntry", async (created) => {
      if (!postProcessPending) return;
      postProcessPending = false;
      Hooks.off("createJournalEntry", hookId);

      try {
        const source = await resolveSourceEntry();
        if (!source) { ui.notifications?.warn(`[${MODULE_ID}] No source journal selected.`); return; }

        const sourceSecrets = await resolveSecretsPageIn(source);
        if (!sourceSecrets) { ui.notifications?.warn(`[${MODULE_ID}] Source has no "${SECRETS_PAGE_NAME}" page.`); return; }

        const srcHTML = normalizeMarkers(String(sourceSecrets.text?.content ?? ""));
        const ul = new DOMParser().parseFromString(srcHTML, "text/html").querySelector("ul.lgmp-checklist");
        if (!ul) { ui.notifications?.warn(`[${MODULE_ID}] Source Secrets page has no <ul class="lgmp-checklist">.`); return; }

        const unchecked = Array.from(ul.querySelectorAll(":scope > li"))
          .map(li => li.textContent?.trim() || "")
          .filter(raw => !!raw && !raw.startsWith("☑"))
          .map(raw => raw.replace(/^\s*[☐☑]\s*/, ""));

        const targetSecrets = await resolveSecretsPageIn(created) || await createOrPickSecretsPage(created, sourceSecrets);
        if (!targetSecrets) { ui.notifications?.warn(`[${MODULE_ID}] Could not locate or create "${SECRETS_PAGE_NAME}" in new journal.`); return; }

        const newUL = `<ul class="lgmp-checklist">\n${unchecked.map(t => `<li>☐ ${escapeHtml(t)}</li>`).join("\n")}\n</ul>`;
        const tHTML = normalizeMarkers(String(targetSecrets.text?.content ?? ""));
        const tDoc = new DOMParser().parseFromString(tHTML, "text/html");
        const tUl = tDoc.querySelector("ul.lgmp-checklist");
        if (tUl) tUl.outerHTML = newUL; else tDoc.body.insertAdjacentHTML("beforeend", newUL);

        await targetSecrets.update({ "text.content": tDoc.body.innerHTML });
        created?.sheet?.render?.(true);

        game.settings.set(MODULE_ID, "lastSourceJournalId", created.id);
        if (targetSecrets?.id) game.settings.set(MODULE_ID, "lastSourcePageId", targetSecrets.id);

        ui.notifications?.info(`[${MODULE_ID}] Prep created. "${SECRETS_PAGE_NAME}" contains only unchecked clues (${unchecked.length}).`);
      } catch (err) {
        console.error(`${MODULE_ID}] Post-process failed`, err);
        ui.notifications?.error(`[${MODULE_ID}] Prep post-processing failed (see console).`);
      }
    });

    // Call your existing generator (unchanged)
    createPrepJournal();

  } catch (err) {
    console.error(`${MODULE_ID}] createPrepJournalSmart failed`, err);
    ui.notifications?.error(`[${MODULE_ID}] Create GM Prep failed (see console).`);
  }
}
async function resolveSourceEntry() {
  const lastJ = game.settings.get(MODULE_ID, "lastSourceJournalId");
  if (lastJ) {
    const byId = game.journal.get(lastJ);
    if (byId) return byId;
  }
  const host = document.querySelector("form.journal-sheet");
  const entry = resolveEntryFromHost(host);
  if (entry) return entry;
  return await promptPickSource(game.journal?.contents ?? []);
}
async function promptPickSource(entries) {
  if (!entries?.length) return null;
  const options = entries.map(e => `<option value="${e.id}">${e.name}</option>`).join("");
  const content = `<div class="form-group"><label>Choose source Journal</label>
    <select name="jid" style="width:100%">${options}</select></div>`;
  return await Dialog.prompt({
    title: "Select Source Journal",
    content,
    label: "Use This",
    callback: html => game.journal.get(html.querySelector("select[name='jid']").value),
    rejectClose: false
  });
}
async function resolveSecretsPageIn(entry) {
  const lastP = game.settings.get(MODULE_ID, "lastSourcePageId");
  const byLast = entry.pages?.get?.(lastP);
  if (byLast && (hasChecklistHTML(byLast.text?.content) || looksLikeSecrets(byLast.name))) return byLast;

  const byName = entry.pages?.contents?.find(p => looksLikeSecrets(p.name));
  if (byName) return byName;

  const byChecklist = entry.pages?.contents?.find(p => hasChecklistHTML(p.text?.content));
  if (byChecklist) return byChecklist;

  return null;
}
async function createOrPickSecretsPage(targetEntry, sourceSecrets) {
  const byName = targetEntry.pages?.contents?.find(p => looksLikeSecrets(p.name));
  if (byName) return byName;

  const name = SECRETS_PAGE_NAME;
  const format = (sourceSecrets?.text?.format ?? 1);
  const [created] = await targetEntry.createEmbeddedDocuments("JournalEntryPage", [{
    name, type: "text", text: { format, content: "" }
  }]);
  return created || null;
}

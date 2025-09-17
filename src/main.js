// lazy-gm-prep / main.js — v13/AppV2
// - Click-to-toggle ☐/☑ in view mode for <ul class="lgmp-checklist">
// - Remember last source journal/page
// - /prep or Alt+P creates a new Journal with only unchecked clues

const MOD = "lazy-gm-prep";
const SECRETS_PAGE_NAME = "4. Define Secrets & Clues";
const SECRETS_PAGE_UUID = ""; // Optional: e.g. "JournalEntry.vz...JournalEntryPage.C94..." to hard-wire

Hooks.once("init", () => {
  // Settings: remember last source, last page
  game.settings.register(MOD, "lastJournalId", {
    name: "Last Source Journal ID", scope: "client", config: false, type: String, default: ""
  });
  game.settings.register(MOD, "lastPageId", {
    name: "Last Source Page ID", scope: "client", config: false, type: String, default: ""
  });
  game.settings.register(MOD, "copyOtherPages", {
    name: "Copy Other Pages Into New Prep", scope: "client", config: false, type: Boolean, default: true
  });

  // Keybinding: Alt+P → create prep
  try {
    game.keybindings.register(MOD, "createPrep", {
      name: "Create GM Prep (unchecked Secrets)",
      hint: "Builds a new Journal with unchecked items from the Secrets & Clues page.",
      editable: [{ key: "KeyP", modifiers: ["Alt"] }],
      restricted: true,
      onDown: () => { game[MOD]?.create?.(); return true; }
    });
  } catch (e) { /* keybindings unavailable in some envs */ }
});

Hooks.on("ready", () => {
  // Expose API for macros or other modules
  game[MOD] = {
    create: (opts={}) => createGMPrepFromLast(opts),
    toggleInstall: () => installToggleHandlers(),
  };
  installToggleHandlers();
  console.log(`[${MOD}] ready`);
});

/* ------------------------- Toggle Handlers ------------------------- */

// Install once: CSS + bind to any current/future journal sheets
function installToggleHandlers() {
  ensureStyle();
  // Bind already-open sheets
  document.querySelectorAll("form.journal-sheet").forEach(bindJournalHost);

  // Bind future renders; capture last journal/page when available
  Hooks.on("renderApplicationV2", (app, el) => {
    // Capture "last source" if this is a JournalEntrySheet with a valid page
    const ctor = app?.constructor?.name || "";
    if (ctor === "JournalEntrySheet") {
      try {
        const entry = app.entry;    // documents.JournalEntry
        const pageId = app.pageId;  // current viewed page id
        if (entry?.id && pageId) {
          // Store last only when the page is the Secrets page (name or checklist present)
          const page = entry.pages?.get?.(pageId);
          const hasChecklist = !!String(page?.text?.content ?? "").includes('class="lgmp-checklist"');
          const nameLooksRight = (page?.name || "").trim().toLowerCase() === SECRETS_PAGE_NAME.trim().toLowerCase();

          if (nameLooksRight || hasChecklist) {
            game.settings.set(MOD, "lastJournalId", entry.id);
            game.settings.set(MOD, "lastPageId", pageId);
          }
        }
      } catch (e) {/* ignore */}
    }

    // Bind click handler to this sheet host (if it is one)
    if (el?.classList?.contains?.("journal-sheet")) bindJournalHost(el);
  });
}

// Add CSS once
function ensureStyle() {
  if (document.getElementById(`${MOD}-style`)) return;
  const style = document.createElement("style");
  style.id = `${MOD}-style`;
  style.textContent = `
    /* Clickable checklist rows */
    ul.lgmp-checklist li { cursor: pointer; user-select: none; }
    ul.lgmp-checklist li:active { opacity: 0.85; }
  `;
  document.head.appendChild(style);
}

// Bind click-to-toggle on a specific journal host
function bindJournalHost(host) {
  if (!host || host.dataset[`${MOD}Bound`] === "1") return;

  // Skip if in edit mode (editor active)
  const inEdit = !!host.querySelector(".editor,.tox-tinymce,[contenteditable='true']");
  if (inEdit) return;

  host.dataset[`${MOD}Bound`] = "1";
  host.addEventListener("click", onChecklistClick, true);
  // console.log(`[${MOD}] bound`, host);
}

// Click handler: persist a single li toggle by mapping DOM → saved HTML
async function onChecklistClick(ev) {
  const liDom = ev.target.closest?.("ul.lgmp-checklist li");
  if (!liDom) return;

  // Find the host and resolve the JournalEntry document
  const host = ev.currentTarget || liDom.closest("form.journal-sheet") || document.querySelector("form.journal-sheet");
  const entry = resolveEntryFromHost(host);
  if (!entry) return ui.notifications?.warn(`[${MOD}] Could not resolve JournalEntry document.`);

  // Resolve the correct Secrets page (fast path: UUID; else lastPageId; else by name; else scan for first checklist)
  const page = await resolveSecretsPage(entry);
  if (!page) return ui.notifications?.warn(`[${MOD}] Secrets page not found on "${entry.name}".`);

  // Map which UL/LI was clicked
  const ulDom = liDom.closest("ul.lgmp-checklist");
  const allUlsDom = Array.from(host.querySelectorAll("ul.lgmp-checklist"));
  const ulIndex = Math.max(0, allUlsDom.indexOf(ulDom));
  const liIndex = Array.from(ulDom.querySelectorAll(":scope > li")).indexOf(liDom);

  try {
    const saved = String(page.text?.content ?? "");
    const doc = new DOMParser().parseFromString(saved, "text/html");
    const allUlsSaved = doc.querySelectorAll("ul.lgmp-checklist");
    let ulSaved = allUlsSaved?.[ulIndex] || allUlsSaved?.[0] || null;

    if (!ulSaved) return ui.notifications?.warn(`[${MOD}] Saved HTML contains no <ul class="lgmp-checklist">.`);

    // Prefer position, then fallback to text match
    let liSaved = ulSaved.querySelectorAll(":scope > li")?.[liIndex] || null;
    if (!liSaved) {
      const clickedText = (liDom.textContent || "").replace(/^\s*[☐☑]\s*/, "").trim();
      liSaved = Array.from(ulSaved.querySelectorAll(":scope > li"))
        .find(li => (li.textContent || "").replace(/^\s*[☐☑]\s*/, "").trim() === clickedText) || null;
    }
    if (!liSaved) return ui.notifications?.warn(`[${MOD}] Could not locate matching item in saved HTML.`);

    // Flip symbol and persist
    const raw = (liSaved.textContent || "").trim();
    const flipped = raw.startsWith("☑") ? raw.replace(/^☑/, "☐")
                  : raw.replace(/^[☐]?/, "☑");
    liSaved.textContent = flipped;

    await page.update({ "text.content": doc.body.innerHTML });

    // Ask parent entry sheet to re-render (works for embedded and pop-out)
    page.parent?.sheet?.render?.(true);
  } catch (err) {
    console.error(MOD, err);
    ui.notifications?.error(`[${MOD}] Toggle failed (see console).`);
  }
}

// Resolve JournalEntry from the host form
function resolveEntryFromHost(host) {
  if (!host) return null;
  const idFromData = host.dataset?.documentId || host.dataset?.entryId;
  let entry = idFromData ? game.journal.get(idFromData) : null;
  if (entry) return entry;

  // Extract from form id like: "JournalEntrySheet5e-JournalEntry-<ID>"
  const m = (host.id || "").match(/JournalEntry-([A-Za-z0-9]{16,})/);
  const entryId = m?.[1] ?? null;
  return entryId ? game.journal.get(entryId) : null;
}

// Resolve the correct Secrets page with multiple strategies
async function resolveSecretsPage(entry) {
  // 1) Explicit UUID override (if provided)
  if (SECRETS_PAGE_UUID) {
    try {
      const from = await fromUuid(SECRETS_PAGE_UUID);
      if (from?.documentName === "JournalEntryPage" && from?.parent?.id === entry.id) return from;
    } catch (e) { /* ignore and fallback */ }
  }

  // 2) Last page id (captured when sheet rendered via AppV2; only used if it contains a checklist)
  try {
    const lastPageId = game.settings.get(MOD, "lastPageId");
    const byLast = entry.pages?.get?.(lastPageId);
    if (byLast && String(byLast.text?.content ?? "").includes('class="lgmp-checklist"')) return byLast;
  } catch (e) { /* ignore */ }

  // 3) By exact name (default: "4. Define Secrets & Clues")
  const wanted = SECRETS_PAGE_NAME.trim().toLowerCase();
  const byName = entry.pages?.contents?.find(p => (p.name || "").trim().toLowerCase() === wanted);
  if (byName) return byName;

  // 4) First page that contains a checklist
  const candidates = entry.pages?.contents?.filter(p => String(p.text?.content ?? "").includes('class="lgmp-checklist"')) || [];
  if (candidates.length) return candidates[0];

  return null;
}

/* -------------------------- /prep & Builder ------------------------- */

async function pickSourceJournal() {
  const entries = game.journal?.contents ?? [];
  if (!entries.length) return null;

  const options = entries.map(e => `<option value="${e.id}">${e.name}</option>`).join("");
  const content = `<div class="form-group"><label>Choose source Journal</label>
    <select name="jid" style="width:100%">${options}</select></div>`;

  return await Dialog.prompt({
    title: "Select Source Journal",
    content, label: "Use This",
    callback: html => game.journal.get(html.querySelector("select[name='jid']").value),
    rejectClose: false
  });
}

async function createGMPrepFromLast(opts = {}) {
  const {
    newName = `GM Prep - ${new Date().toLocaleDateString()}`,
    copyOtherPages = game.settings.get(MOD, "copyOtherPages"),
    pageName = SECRETS_PAGE_NAME
  } = opts;

  // Resolve source Journal
  let source = game.journal.get(game.settings.get(MOD, "lastJournalId"));
  if (!source) {
    source = await pickSourceJournal();
    if (!source) return ui.notifications?.warn(`[${MOD}] No source journal selected.`);
  }

  // Resolve the Secrets page
  let secrets = await resolveSecretsPage(source);
  if (!secrets) {
    // fallback by name only for the chosen source
    const wanted = pageName.trim().toLowerCase();
    secrets = source.pages?.contents?.find(p => (p.name || "").trim().toLowerCase() === wanted) || null;
  }
  if (!secrets) return ui.notifications?.warn(`[${MOD}] Source has no page named "${pageName}" or with a checklist.`);

  // Extract only unchecked items from saved HTML
  const savedHTML = String(secrets.text?.content ?? "");
  const dom = new DOMParser().parseFromString(savedHTML, "text/html");
  const ul = dom.querySelector("ul.lgmp-checklist");
  if (!ul) return ui.notifications?.warn(`[${MOD}] Secrets page has no <ul class="lgmp-checklist">.`);

  const unchecked = [];
  for (const li of ul.querySelectorAll(":scope > li")) {
    const raw = (li.textContent || "").trim();
    const text = raw.replace(/^\s*[☐☑]\s*/, "");
    if (!raw.startsWith("☑") && text) unchecked.push(text);
  }

  const newUL = `<ul class="lgmp-checklist">\n${unchecked.map(t => `<li>☐ ${t}</li>`).join("\n")}\n</ul>`;

  // Compose pages for new Journal
  const newPages = [];
  if (copyOtherPages) {
    for (const p of source.pages.contents) {
      const data = p.toObject(); delete data._id;
      if (p._id === secrets._id && p.type === "text") {
        data.text = { ...(data.text ?? {}), content: newUL };
      }
      newPages.push(data);
    }
  } else {
    // Only Secrets page as text page
    newPages.push({
      name: pageName, type: "text",
      text: { format: (secrets.text?.format ?? 1), content: newUL }
    });
  }

  const created = await JournalEntry.create({ name: newName, pages: newPages });
  created?.sheet?.render(true);
  ui.notifications?.info(`[${MOD}] Created "${created.name}" with ${unchecked.length} unchecked clue(s).`);
  return created;
}

/* -------------------------- Chat Command (/prep) -------------------------- */

// Optional: allow "/prep" in chat to build from last source
Hooks.on("chatMessage", (log, message, chatData) => {
  const parts = (message || "").trim().split(/\s+/);
  if (parts[0]?.toLowerCase() === "/prep") {
    createGMPrepFromLast().catch(err => {
      console.error(MOD, err);
      ui.notifications?.error(`[${MOD}] /prep failed (see console).`);
    });
    return false; // swallow the chat message
  }
});

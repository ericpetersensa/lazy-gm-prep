// src/journal/generator.js
import { createGettingStartedPage } from './pages/gettingStarted.js';
import { createSecretsCluesPage } from './pages/secretsClues.js';
import { createReviewCharactersPage } from './pages/reviewCharacters.js';
import { createImportantNpcsPage } from './pages/importantNpcs.js';
import { createDefaultSectionPage } from './pages/defaultSection.js';
import { createStrongStartPage } from './pages/strongStart.js';

import {
  ensureFolder,
  nextSequenceNumber,
  findPreviousSession,
  getPreviousSectionHTML
} from './helpers.js';

import { PAGE_ORDER, getSetting } from '../settings.js';

export async function createPrepJournal() {
  const separate = !!getSetting('separatePages', true);
  const folderName = getSetting('folderName', 'GM Prep');
  const prefix = getSetting('journalPrefix', 'Session');
  const includeDate = !!getSetting('includeDateInName', true);

  const charRows = Number(getSetting('initialCharacterRows', 5)) || 5;
  const npcRows  = Number(getSetting('initialNpcRows', 5)) || 5;

  const folderId = await ensureFolder(folderName);
  const seq = nextSequenceNumber(prefix);
  const isFirst = seq === 0;

  const entryName = includeDate
    ? `${prefix} ${seq}: ${new Date().toLocaleDateString()}`
    : `${prefix} ${seq}`;

  const prev = findPreviousSession(prefix);

  if (separate) {
    return await createSeparatePages(entryName, folderId, prev, isFirst, { charRows, npcRows });
  } else {
    return await createCombinedPage(entryName, folderId, prev, isFirst, { charRows, npcRows });
  }
}

async function createSeparatePages(entryName, folderId, prevJournal, isFirst, { charRows, npcRows }) {
  const pages = [];

  if (isFirst) {
    pages.push(createGettingStartedPage());
  }

  for (const def of PAGE_ORDER) {
    const copyOn = !!getSetting(`copy.${def.key}`, true);
    const prevContent = copyOn ? getPreviousSectionHTML(prevJournal, def) : null;

    switch (def.key) {
      case 'secrets-clues':
        pages.push(createSecretsCluesPage(def, prevContent));
        break;
      
      case 'strong-start':
      pages.push(createStrongStartPage(def, prevContent));
      break;

      case 'review-characters':
        pages.push(createReviewCharactersPage(def, prevContent, charRows));
        break;

      case 'important-npcs':
        pages.push(createImportantNpcsPage(def, prevContent, npcRows));
        break;

      default:
        pages.push(createDefaultSectionPage(def, prevContent));
    }
  }

  const entry = await JournalEntry.create({ name: entryName, folder: folderId, pages });
  ui.notifications?.info(game.i18n.format('lazy-gm-prep.notifications.created', { name: entry.name }));
  return entry;
}

/**
 * Combined mode: all steps rendered into a single Text page named with the module name.
 * If this is the first journal, we also add a separate "Getting Started" page for onboarding.
 */
async function createCombinedPage(entryName, folderId, prevJournal, isFirst, { charRows, npcRows }) {
  const combinedPageName = game.i18n.localize("lazy-gm-prep.module.name");

  const sectionHtml = [];

  for (const def of PAGE_ORDER) {
    const copyOn = !!getSetting(`copy.${def.key}`, true);
    const prevContent = copyOn ? getPreviousSectionHTML(prevJournal, def) : null;

    // Reuse the same per-section builders, then embed their HTML under an <h2> header.
    let pageLike;
    switch (def.key) {
      case 'secrets-clues':
        pageLike = createSecretsCluesPage(def, prevContent);
        break;
      
      case 'strong-start':
      pageLike = createStrongStartPage(def, prevContent);
      break;

      case 'review-characters':
        pageLike = createReviewCharactersPage(def, prevContent, charRows);
        break;

      case 'important-npcs':
        pageLike = createImportantNpcsPage(def, prevContent, npcRows);
        break;

      default:
        pageLike = createDefaultSectionPage(def, prevContent);
    }

    const title = game.i18n.localize(def.titleKey);
    const content = pageLike?.text?.content ?? "";
    sectionHtml.push(`<h2>${title}</h2>\n${content}`);
  }

  const combinedContent = sectionHtml.join("\n<hr>\n");

  const pages = [];

  // Include Getting Started for the first journal only (not a "step" so still fine in combined mode)
  if (isFirst) {
    pages.push(createGettingStartedPage());
  }

  pages.push({
    name: combinedPageName,
    type: 'text',
    text: { format: 1, content: combinedContent }
  });

  const entry = await JournalEntry.create({ name: entryName, folder: folderId, pages });
  ui.notifications?.info(game.i18n.format('lazy-gm-prep.notifications.created', { name: entry.name }));
  return entry;
}

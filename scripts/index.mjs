import { grantXp, grantXpAfterBattle } from './dialogs/grant-xp.mjs';
import { distributeCurrency } from './dialogs/distribute-currency.mjs';
import { MODULE_ID } from './lib/module-id.mjs';
import { getPcActors } from './lib/actor.mjs';
import { isPc } from './lib/utils.mjs';
import { PartySheetApp } from './apps/party-sheet-app.mjs';
import { CurrencyManagementApp } from './apps/currency-management-app.mjs';
import { registerSettings, getSetting, SHOW_PARTY_SHEET_BUTTON, SHOW_CURRENCY_BUTTON_IN_CHARACTER_SHEET, SHOW_XP_AFTER_BATTLE } from './lib/settings.mjs';
import { registerHandlebarsHelpers } from './lib/tpl.mjs';
import { un$ } from './lib/un$.mjs';
import { CurrencyManagementBtnElement } from './components/currency-management-btn.mjs';
import { ShowPartySheetBtnElement } from './components/show-party-sheet-btn.mjs';

function injectModuleApi() {
  if (!MODULE_ID) {
    return;
  }

  const module = game.modules?.get(MODULE_ID);

  if (module) {
    registerHandlebarsHelpers();

    const api = {
      grantXp,
      distributeCurrency,
      async showPartySheet(actors = getPcActors(true), folderId = '', partyData = undefined) {
        return PartySheetApp.showApp({actors, folderId, partyData});
      },
      /**
       * @param {string} folderId
       */
      async showPartySheetForFolder(folderId) {
        return PartySheetApp.showPartySheetForFolder(folderId);
      },
      async showCurrencyManagement(actor = game.user?.character) {
        if (actor) {
          return CurrencyManagementApp.showApp({actor: /** @type BlackFlagActor */(actor)});
        } else {
          ui.notifications?.error('No character provided');
        }
      },
      grantXpAfterBattle,
    };

    Object.assign(module, {api});
  };
}

/**
 * @param {unknown} _app
 * @param {JQuery<HTMLElement> | HTMLElement} $html
 * @param {PCSheetData} _data
 */
async function injectCurrencyButton(_app, $html, _data) {
  if (/** @type number*/(getSetting(SHOW_CURRENCY_BUTTON_IN_CHARACTER_SHEET)) > (game.user?.role ?? 1)) {
    return;
  }

  if (!_data.owner) {
    return;
  }

  const targetCell = un$($html)?.querySelector('tbody[data-section="currency"] tr td.name');
  if (targetCell?.querySelector('bfu-currency-management-btn') || !targetCell) {
    return;
  }

  CurrencyManagementBtnElement.register();

  targetCell.innerHTML += `<bfu-currency-management-btn actor-id="${_data.actor.id}"></bfu-currency-management-btn>`;
}

/**
 * @param {unknown} _app
 * @param {JQuery<HTMLElement>} $html
 */
function injectPartySheetButton(_app, $html) {
  if (/** @type number */(getSetting(SHOW_PARTY_SHEET_BUTTON)) > (game.user?.role ?? 1)) {
    return;
  }

  un$($html)?.querySelectorAll('.folder').forEach((folderElement) => {
    const folderId = /** @type HTMLElement */(folderElement).dataset.folderId;
    if (!folderId) {
      return;
    }
    const folder = game.folders?.get(folderId);
    if (!folder) {
      return;
    }

    // Check if the folder contains any PC actors
    // @ts-expect-error wrong typings?
    const hasPCActors = folder.contents.some(isPc);
    if (!hasPCActors) {
      return;
    }

    // Avoid duplicate icons
    if (folderElement.querySelector('bfu-show-party-sheet-btn')) {
      return;
    }

    ShowPartySheetBtnElement.register();

    const folderHeader = folderElement.querySelector('.folder-header');
    if (folderHeader) {
      folderHeader.innerHTML += `<bfu-show-party-sheet-btn folder-id="${folderId}"></bfu-show-party-sheet-btn>`;
    }
  });
}

function onDeleteCombat() {
  if (getSetting(SHOW_XP_AFTER_BATTLE) && game.user?.isGM) {
    grantXpAfterBattle();
  }
}

Hooks.once('dragRuler.ready', async (/** @type {Constructor} */ SpeedProvider) => {
  const integrate = await import('./integrations/drag-ruler.mjs');
  integrate.default(SpeedProvider);
});

Hooks.on('init', injectModuleApi);
Hooks.once('init', registerSettings);
Hooks.on('renderPCSheet', injectCurrencyButton);
Hooks.on('renderActorDirectory', injectPartySheetButton);
Hooks.on('deleteCombat', onDeleteCombat);

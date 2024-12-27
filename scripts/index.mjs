import { grantXp } from './dialogs/grant-xp.mjs';
import { distributeCurrency } from './dialogs/distribute-currency.mjs';
import { MODULE_ID } from './lib/module-id.mjs';
import { getPcActors } from './lib/actor.mjs';
import { registerPartial } from './lib/tpl.mjs';
import { isPc } from './lib/utils.mjs';
import { PartySheetApp } from './apps/party-sheet-app.mjs';
import { CurrencyManagementApp } from './apps/currency-management-app.mjs';

function injectModuleApi() {
  if (!MODULE_ID) {
    return;
  }

  const module = game.modules?.get(MODULE_ID);

  if (module) {
    const api = {
      grantXp,
      distributeCurrency,
      showPartySheet(actors = getPcActors()) {
        return new PartySheetApp({actors});
      },
    };

    Object.assign(module, {api});
  };
}

/**
 * @param {unknown} _app
 * @param {JQuery<HTMLElement>} $html
 * @param {PCSheetData} _data
 */
async function injectCurrencyButton(_app, $html, _data) {
  if (!_data.owner && !game.user?.isGM) {
    return;
  }

  const targetCell = $html.find('tbody[data-section="currency"] tr td.name');
  if (targetCell.find('.currency-management').length > 0) {
    return;
  }

  const $currencyManagement = $(
    `<a class="currency-management">
      <i class="fas fa-coins" title="Manage currency"></i>
    </a>`,
  );

  $currencyManagement.on('click', async () => {
    await registerPartial('currency-input');
    await registerPartial('actor-checkbox');
    const app = new CurrencyManagementApp({actor: _data.actor, isOwner: _data.owner});
    app.render(true);
  });

  targetCell.append($currencyManagement);
}

/**
 * @param {unknown} _app
 * @param {JQuery<HTMLElement>} $html
 */
function injectPartySheetButton(_app, $html) {
  $html.find('.folder').each((_index, folderElement) => {
    const folderId = folderElement.dataset.folderId;
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

    const $folder = $(folderElement);

    // Avoid duplicate icons
    if ($folder.find('.party-sheet-button').length > 0) {
      return;
    }

    // Create and append the icon
    const button = $(
      `<a class="create-button party-sheet-button">
        <i class="fas fa-users" title="Party sheet"></i>
      </a>`,
    );
    $folder.find('h3.noborder').append(button);

    button.on('click', (event) => {
      event.stopImmediatePropagation();
      // @ts-expect-error wrong typings?
      const actors = folder.contents.filter(isPc);
      const app = new PartySheetApp({actors, folderId: folder._id});
      app.render(true);
      app.registerHooks();
    });
  });
}

Hooks.on('init', injectModuleApi);
Hooks.on('renderPCSheet', injectCurrencyButton);
Hooks.on('renderActorDirectory', injectPartySheetButton);

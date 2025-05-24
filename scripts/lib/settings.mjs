import { moduleBus } from './module-bus.mjs';
import { MODULE_ID } from './module-id.mjs';

export const SHOW_CURRENCY_BUTTON_IN_CHARACTER_SHEET = 'show-currency-button-in-character-sheet';
export const SHOW_PARTY_SHEET_BUTTON = 'show-party-sheet-button';
export const SHOW_GRANT_XP_BUTTON = 'show-grant-xp-button';
export const SHOW_DISTRIBUTE_CURRENCY_BUTTON = 'show-distribute-currency-button';
export const SHOW_XP_AFTER_BATTLE = 'show-xp-after-battle';
export const SHOW_DOOM_POINTS = 'show-xp-after-battle';
export const USE_GP_WEALTH = 'use-gp-wealth';

/**
 * @param {string} settingName
 */
export function getSetting(settingName) {
  return game.settings?.get(
    // @ts-expect-error wrong typings?
    /** @type string */(MODULE_ID),
    settingName,
  );
}

/**
 * @param {string} settingName
 * @param {unknown} value
 */
export async function setSetting(settingName, value) {
  await game.settings?.set(
    // @ts-expect-error wrong typings?
    /** @type string */(MODULE_ID),
    settingName,
    value,
  );
}

/**
 * @param {string} settingName
 * @param {ClientSettings.RegisterOptions<any>} options
 */
export async function registerSetting(settingName, options) {
  game.settings?.register(
    // @ts-expect-error wrong typings?
    /** @type string */(MODULE_ID),
    settingName,
    options,
  );
}

export function registerSettings() {
  const roleBasedSetting = {
    'scope': /** @type {'world' | 'client'} */('world'),
    'requiresReload': true,
    'type': Number,
    'config': true,
    'default': 1,
    'choices': {
      1: 'All Players',
      2: 'Trusted Players',
      3: 'Assistant GMs',
      4: 'GMs',
    },
  };

  const checkboxBasedSetting = {
    'scope': /** @type {'world' | 'client'} */('world'),
    'requiresReload': true,
    'type': Boolean,
    'config': true,
    'default': true,
  };

  registerSetting(
    SHOW_CURRENCY_BUTTON_IN_CHARACTER_SHEET,
    {
      name: 'Show "Manage currency" button in character sheet',

      ...roleBasedSetting,
    },
  );

  registerSetting(
    SHOW_PARTY_SHEET_BUTTON,
    {
      name: 'Show "Party Sheet" button in folder header',

      ...roleBasedSetting,
    },
  );

  registerSetting(
    SHOW_GRANT_XP_BUTTON,
    {
      name: 'Show "Grant XP" button in the party sheet (GMs only)',
      ...checkboxBasedSetting,
      requiresReload: false,
    },
  );

  registerSetting(
    SHOW_DISTRIBUTE_CURRENCY_BUTTON,
    {
      name: 'Show "Distribute Currency" button in the party sheet (GMs only)',
      ...checkboxBasedSetting,
      requiresReload: false,
    },
  );

  registerSetting(
    SHOW_XP_AFTER_BATTLE,
    {
      name: 'Show "Grant XP" button after a battle',
      ...checkboxBasedSetting,
      requiresReload: false,
    },
  );

  registerSetting(
    SHOW_DOOM_POINTS,
    {
      name: 'Show Doom points in the party sheet',
      hint: 'Create an NPC called _partyData. It will be used as a storage for the Doom points.',

      ...checkboxBasedSetting,
      requiresReload: false,
    },
  );

  registerSetting(
    USE_GP_WEALTH,
    {
      name: 'Use GP wealth instead of the highest denomination',
      hint: 'If enabled, the wealth will be displayed in GP instead of highest possible denomination.',

      ...checkboxBasedSetting,
    },
  );

  const modulePrefix = `${MODULE_ID}.`;
  return Hooks.on('updateSetting', function onUpdateSetting(/** @type {{ key: string; value: unknown; }} */ setting) {
    if (setting.key.startsWith(modulePrefix)) {
      moduleBus.trigger(
        `setting.${setting.key.replace(modulePrefix, '')}`,
        setting.value,
      );
    }
  });
};
import { distributeCurrency } from '../dialogs/distribute-currency.mjs';
import { grantXp } from '../dialogs/grant-xp.mjs';
import { getActorCoinage } from '../lib/actor-currency.mjs';
import { moduleBus } from '../lib/module-bus.mjs';
import { coinageToGold, coinageToStrings, coinageToWealth } from '../lib/currency.mjs';
import { firstToUpper } from '../lib/first-to-upper.mjs';
import { getSetting, SHOW_DISTRIBUTE_CURRENCY_BUTTON, SHOW_DOOM_POINTS, SHOW_GRANT_XP_BUTTON, USE_GP_WEALTH } from '../lib/settings.mjs';
import { CurrencyManagementApp } from './currency-management-app.mjs';
import { manageActorFlag } from '../lib/actor.mjs';
import { PartySheetElement } from '../components/party-sheet.mjs';
import { getFolderActors } from '../lib/utils.mjs';

const {ApplicationV2} = foundry.applications.api;

/**
 * @param {{name?: string | null, _id?: string | null} | null | undefined} item
 * @returns {{name: string, _id: string} | null}
 */
function slimItem(item) {
  return item ? {name: item.name ?? '', _id: item._id ?? ''} : null;
}

export class PartySheetApp extends ApplicationV2 {
  /**
   * @param {{ actors: BlackFlagActor[]; folderId?: string; partyData?: BlackFlagActor}} params
   */
  constructor(params, options = {}) {
    super(options);
    /** @type BlackFlagActor[] */
    this.actors = params.actors;
    this.folderId = params.folderId;
    /** @type BlackFlagActor | undefined*/
    this.partyData = params.partyData;
  }

  /**
   * @type Array<() => void>
   */
  #unsubscribers = [];

  /**
   * @type Array<{event: string, id: number}>
   */
  #hookIds = [];

  /** @type {PartySheetElement | null} */
  #sheet = null;

  static DEFAULT_OPTIONS = {
    id: 'party-sheet-app',
    classes: ['bf-utilities', 'party-sheet-app'],
    window: {
      title: 'Party Sheet',
      resizable: true,
    },
    position: {
      width: 640,
      height: /** @type {'auto'} */ ('auto'),
    },
  };

  /**
   * @param {BlackFlagActor} actor
   * @returns {string | null}
   */
  #actorMovement(actor) {
    const movement = actor.system.traits.movement;
    if (
      movement.base !== 30 ||
      movement.custom.length ||
      movement.multiplier !== '1' ||
      movement.tags.size ||
      movement.types.walk !== 30 ||
      Object.values(movement.types).filter(s => s !== 0).length > 1
    ) {
      return movement.labels.join(', ');
    }

    return null;
  }

  /**
   * @param {BlackFlagActor} actor
   * @returns {Promise<ActorTplData>}
   */
  async #actorViewModel(actor) {
    const classes = [];
    for (const characterClass of Object.values(actor.system.progression.classes)) {
      const entry = {
        name: characterClass.document.name,
        levels: characterClass.levels,
        _id: characterClass.document._id,
        img: characterClass.document.img,
      };
      if (characterClass.originalClass) {
        classes.unshift(entry);
      } else {
        classes.push(entry);
      }
    }

    const skills = Object.entries(actor.system.proficiencies.skills).map(([name, skill]) => {
      return {
        name,
        label: skill.labels.name,
        mod: skill.mod,
        proficiencyLevel: skill.proficiency.multiplier,
      };
    });

    const coinageAndWealth = await this.#actorCoinageAndWealth(actor);

    return {
      _id: actor._id,
      img: actor.img,
      name: actor.name,
      ac: {
        value: actor.system.attributes.ac.value,
        label: actor.system.attributes.ac.label,
      },
      attunement: actor.system.attributes.attunement,
      hd: {
        max: actor.system.attributes.hd.max,
        available: actor.system.attributes.hd.available,
      },
      hp: {
        max: actor.system.attributes.hp.max,
        value: actor.system.attributes.hp.value,
        thp: actor.system.attributes.hp.temp,
      },
      luck: actor.system.attributes.luck.value || 0,
      classes,
      skills,
      highestSkills: [],
      background: slimItem(actor.system.progression.background),
      heritage: slimItem(actor.system.progression.heritage),
      lineage: slimItem(actor.system.progression.lineage),
      ...coinageAndWealth,
      senses: actor.system.traits.senses.label ? actor.system.traits.senses.label : null,
      type: actor.system.traits.type.label !== 'Humanoid' ? actor.system.traits.type.label : null,
      size: actor.system.traits.size !== 'medium' ? firstToUpper(actor.system.traits.size ?? 'medium') : null,
      movement: this.#actorMovement(actor),
      talents: actor.items.filter(i => i.type === 'talent').map(slimItem),

      isOwner: actor.id === game.user?.character?.id,
    };
  }

  /**
   * @param {BlackFlagActor} actor
   * @returns {Promise<{coinage: string, wealth: string,}>}
   */
  async #actorCoinageAndWealth(actor) {
    const coinage = await getActorCoinage(actor);
    const chunks = coinageToStrings(coinage);
    const wealth = getSetting(USE_GP_WEALTH) ? coinageToGold(coinage) : coinageToWealth(coinage);

    return {
      coinage: chunks.join(', '),
      wealth,
    };
  }

  /**
   * @returns {Promise<PartySheetData>}
   */
  async getData() {
    const actors = await Promise.all(this.actors.map(this.#actorViewModel, this));

    for (const [actorIndex, actor] of actors.entries()) {
      for (const [skillIndex, skill] of actor.skills.entries()) {
        let hasHigher = false;

        for (const [otherActorIndex, otherActor] of actors.entries()) {
          if (otherActorIndex === actorIndex) {
            continue;
          }

          if (skill.mod < otherActor.skills[skillIndex].mod) {
            hasHigher = true;
          }
        }

        skill.isHighest = !hasHigher;
      }

      actor.highestSkills = actor.skills
        .filter(s => s.isHighest)
        .toSorted((skillA, skillB) => {
          const modDiff = skillB.mod - skillA.mod;
          if (modDiff !== 0) {
            return modDiff;
          } else {
            return skillA.label > skillB.label ? -1 : 1;
          }
        })
        .map((s) => {
          return {
            label: s.label,
            mod: `${s.mod > 0 ? '+' : '-'}${Math.abs(s.mod)}`,
            proficiencyLevel: s.proficiencyLevel,
          };
        });
    }

    const enableDoomPoints = getSetting(SHOW_DOOM_POINTS);
    const doomPoints = enableDoomPoints
      ? (
        this.partyData
          ? manageActorFlag(this.partyData, 'doomPoints') ?? 0
          : null
      )
      : 0;

    return {
      isGM: !!game.user?.isGM,
      actors,
      enableGrantXp: !!getSetting(SHOW_GRANT_XP_BUTTON),
      enableDistributeCurrency: !!getSetting(SHOW_DISTRIBUTE_CURRENCY_BUTTON),
      enableDoomPoints: !!enableDoomPoints,
      doomPoints: /** @type {number | null} */ (doomPoints),
    };
  }

  /**
   * @param {any} _options
   */
  async _prepareContext(_options) {
    return /** @type {any} */ (this.getData());
  }

  /**
   * @param {any} context
   * @returns {Promise<HTMLElement>}
   */
  async _renderHTML(context) {
    PartySheetElement.register();

    if (!this.#sheet) {
      this.#sheet = this.#createSheet();
    }
    this.#sheet.setAttribute('data', JSON.stringify(context));

    return this.#sheet;
  }

  /**
   * @param {HTMLElement} result
   * @param {HTMLElement} content
   */
  _replaceHTML(result, content) {
    // Re-attaching the element would needlessly re-render it
    if (result.parentElement !== content) {
      content.replaceChildren(result);
    }
  }

  /**
   * @returns {PartySheetElement}
   */
  #createSheet() {
    const sheet = /** @type {PartySheetElement} */ (document.createElement('bfu-party-sheet'));

    sheet.addEventListener('opensheet', (event) => {
      const actorId = /** @type {CustomEvent<string>} */(event).detail;
      this.#findActor(actorId)?.sheet?.render(true);
    });

    sheet.addEventListener('luck', (event) => {
      if (!game.user?.isGM) {
        return;
      }
      const {actorId, delta} = /** @type {CustomEvent<{actorId: string, delta: number}>} */(event).detail;
      const actor = this.#findActor(actorId);
      if (!actor) {
        return;
      }
      const currentLuck = actor.system.attributes.luck.value;
      if (delta < 0 && currentLuck > 0) {
        actor.update({system: {attributes: {luck: {value: currentLuck - 1}}}});
      } else if (delta > 0 && currentLuck < CONFIG.BlackFlag.luck.max) {
        actor.system.addLuck();
      }
    });

    sheet.addEventListener('managecurrency', (event) => {
      const actor = this.#findActor(/** @type {CustomEvent<string>} */(event).detail);
      if (actor) {
        CurrencyManagementApp.showApp({actor});
      }
    });

    sheet.addEventListener('partyaction', (event) => {
      const action = /** @type {CustomEvent<string>} */(event).detail;

      if (action === 'distribute-currency') {
        distributeCurrency(this.actors);
      }

      if (action === 'grant-xp') {
        grantXp(this.actors);
      }
    });

    sheet.addEventListener('doom', (event) => {
      manageActorFlag(this.partyData, 'doomPoints', /** @type {CustomEvent<{points: number}>} */(event).detail.points);
    });

    sheet.addEventListener('openfeature', (event) => {
      const targetEl = /** @type {HTMLElement} */(event.target);
      const itemId = /** @type {string} */(/** @type {CustomEvent} */(event).detail);
      const actorId = /** @type {HTMLElement | null} */(targetEl.closest('[data-actor-id]'))?.dataset.actorId;
      const item = this.#findActor(actorId)?.items.get(itemId);
      if (item) {
        item.sheet?.render(true);
      } else {
        console.warn('Item not found for ID:', itemId);
      }
    });

    return sheet;
  }

  /**
   * @param {string | undefined} actorId
   * @returns {BlackFlagActor | undefined}
   */
  #findActor(actorId) {
    return this.actors.find(a => a._id === actorId);
  }

  /**
   * @param {any} context
   * @param {any} options
   */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    for (const setting of [SHOW_GRANT_XP_BUTTON, SHOW_DISTRIBUTE_CURRENCY_BUTTON, SHOW_DOOM_POINTS]) {
      this.#unsubscribers.push(
        moduleBus.listenSettingChange(setting, () => this.render(false)),
      );
    }
  }

  /**
   * @param {any} options
   */
  _onClose(options) {
    this.#unsubscribe();
    this.#unregisterHooks();

    super._onClose(options);
  }

  #unsubscribe() {
    for (const unsubscribe of this.#unsubscribers.splice(0)) {
      unsubscribe();
    }
  }

  #unregisterHooks() {
    clearTimeout(this.#renderTimer);
    for (const {event, id} of this.#hookIds.splice(0)) {
      Hooks.off(event, id);
    }
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #renderTimer;

  // A single transaction updates several items, so coalesce the re-renders
  #scheduleRender() {
    clearTimeout(this.#renderTimer);
    this.#renderTimer = setTimeout(() => this.render(false), 50);
  }

  registerHooks() {
    this.#hookIds.push({event: 'updateActor', id: Hooks.on('updateActor', (/** @type BlackFlagActor */actor) => {
      // Check if the actor belongs to the tracked folder
      if (actor.folder?.id === this.folderId) {
        this.#scheduleRender();
      }
    })});

    // Coins, talents, attunement etc. are embedded items, changing them doesn't trigger updateActor
    for (const event of ['createItem', 'updateItem', 'deleteItem']) {
      this.#hookIds.push({event, id: Hooks.on(event, (/** @type BlackFlagItem */item) => {
        const parent = item.parent;
        if (parent && this.actors.some(actor => actor.id === parent.id)) {
          this.#scheduleRender();
        }
      })});
    }

    if (this.folderId) {
      this.#hookIds.push({event: 'updateFolder', id: Hooks.on('updateFolder', (/** @type Folder */folder) => {
        // Check if the folder matches the tracked folder ID
        if (folder.id === this.folderId) {
          this.#scheduleRender();
        }
      })});
    }
  }

  /**
   * @param {{ actors: BlackFlagActor[]; folderId?: string; partyData?: BlackFlagActor}} params
   * @returns {Promise<PartySheetApp>}
   */
  static async showApp(params) {
    const app = new PartySheetApp(params);
    void app.render(true);
    app.registerHooks();

    return app;
  }

  /**
   * @param {string} folderId
   */
  static async showPartySheetForFolder(folderId) {
    const {actors, partyData} = getFolderActors(folderId);
    return PartySheetApp.showApp({actors, folderId, partyData});
  }
}

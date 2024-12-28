import { distributeCurrency } from '../dialogs/distribute-currency.mjs';
import { grantXp } from '../dialogs/grant-xp.mjs';
import { getActorCoinage } from '../lib/actor-currency.mjs';
import { coinageToStrings, coinageToWealth } from '../lib/currency.mjs';
import { firstToUpper } from '../lib/first-to-upper.mjs';
import { getPath } from '../lib/tpl.mjs';
import { CurrencyManagementApp } from './currency-management-app.mjs';

// @ts-expect-error wrong typings?
export class PartySheetApp extends Application {
  /**
   * @param {{ actors: BlackFlagActor[]; folderId?: string; }} params
   */
  constructor(params, options = {}) {
    super(options);
    /** @type BlackFlagActor[] */
    this.actors = params.actors;
    this.folderId = params.folderId;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions || {}, {
      baseApplication: '',
      title: 'Party Sheet',
      id: 'party-sheet-app',
      template: getPath('party-sheet'),
      width: 640,
      height: 'auto',
      resizable: true,
    });
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
      xp: actor.system.progression.xp,
      background: actor.system.progression.background,
      heritage: actor.system.progression.heritage,
      lineage: actor.system.progression.lineage,
      ...coinageAndWealth,
      senses: actor.system.traits.senses.label ? actor.system.traits.senses.label : null,
      type: actor.system.traits.type.label !== 'Humanoid' ? actor.system.traits.type.label : null,
      size: actor.system.traits.size !== 'medium' ? firstToUpper(actor.system.traits.size) : null,
      movement: actor.system.traits.movement.labels,

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

    return {
      coinage: chunks.join(', '),
      wealth: coinageToWealth(coinage),
    };
  }

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
          };
        });
    }

    return {
      isGM: !!game.user?.isGM,
      actors,
    };
  }

  /**
   * @param {JQuery<HTMLElement>} html
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.on('click', '[data-open-sheet]', (event) => {
      const actor = this.actors[event.currentTarget.dataset.openSheet];
      if (actor) {
        actor.sheet?.render(true); // Open the actor's sheet
      }
    });

    html.on('click', '[data-open-item]', (event) => {
      const _id = event.currentTarget.dataset.openItem;
      const actor = this.actors[event.currentTarget.dataset.actorIndex];
      const item = actor.items.get(_id);
      if (item) {
        item.sheet?.render(true); // Open the item's sheet
      } else {
        console.warn('Item not found for ID:', _id);
      }
    });

    html.on('click', '[data-action]', (event) => {
      const action = event.currentTarget.dataset.action;

      if (action === 'distribute-currency') {
        distributeCurrency(this.actors);
      }

      if (action === 'grant-xp') {
        grantXp(this.actors);
      }
    });

    html.on('click', '[data-remove-luck]', (event) => {
      if (!game.user?.isGM) {
        return;
      }
      const actor = this.actors[event.currentTarget.dataset.removeLuck];
      const currentLuck = actor.system.attributes.luck.value;
      if (currentLuck > 0) {
        actor.update({system: {attributes: {luck: {value: currentLuck - 1}}}});
      }
    });

    html.on('click', '[data-grant-luck]', (event) => {
      if (!game.user?.isGM) {
        return;
      }
      const actor = this.actors[event.currentTarget.dataset.grantLuck];
      const currentLuck = actor.system.attributes.luck.value;
      if (currentLuck < CONFIG.BlackFlag.luck.max) {
        actor.system.addLuck();
      }
    });

    html.on('click', '[data-manage-currency]', (event) => {
      const actor = this.actors[event.currentTarget.dataset.manageCurrency];
      CurrencyManagementApp.showApp({actor});
    });
  }

  registerHooks() {
    Hooks.on('updateActor', (/** @type BlackFlagActor */actor) => {
      // Check if the actor belongs to the tracked folder
      if (actor.folder?.id === this.folderId) {
        this.render(false);
      }
    });

    if (this.folderId) {
      Hooks.on('updateFolder', (/** @type Folder */folder) => {
        // Check if the folder matches the tracked folder ID
        if (folder.id === this.folderId) {
          this.render(false);
        }
      });
    }
  }

  /**
   * @param {{ actors: BlackFlagActor[]; folderId?: string; }} params
   * @returns {Promise<PartySheetApp>}
   */
  static async showApp(params) {
    const app = new PartySheetApp(params);
    app.render(true);
    app.registerHooks();

    return app;
  }
}
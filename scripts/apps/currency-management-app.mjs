import { ActorSelectorElement } from '../components/actor-selector.mjs';
import { CurrencyInputElement } from '../components/currency-input.mjs';
import { currencyList, getActorCoinage, upsertActorCoinage } from '../lib/actor-currency.mjs';
import { getPCActorsInSameFolder } from '../lib/actor.mjs';
import { NotEnoughMoneyError, spendCoinage } from '../lib/currency.mjs';
import { getActiveGMs } from '../lib/get-active-gms.mjs';
import { MODULE_ID } from '../lib/module-id.mjs';
import { getPath } from '../lib/tpl.mjs';

// @ts-expect-error wrong typings?
export class CurrencyManagementApp extends Application {
  /**
   * @param {{ actor: BlackFlagActor }} params
   */
  constructor(params, options = {}) {
    super(options);
    /** @type BlackFlagActor */
    this.actor = params.actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions || {}, {
      baseApplication: '',
      title: 'Currency Management',
      id: 'currency-management-app',
      template: getPath('currency-management'),
      width: 640,
      height: 'auto',
      resizable: true,
    });
  }

  /**
   * @param {JQuery<HTMLElement>} html
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.on('submit', this.#onSubmit);
  }

  #onSubmit = (/** @type {Event} */ event) => {
    event.preventDefault();

    const formData = new FormData(/** @type HTMLFormElement */(event.target));

    /** @type Coinage */
    const coinage = {
      pp: parseFloat(/** @type string */(formData.get('platinum'))),
      gp: parseFloat(/** @type string */(formData.get('gold'))),
      sp: parseFloat(/** @type string */(formData.get('silver'))),
      cp: parseFloat(/** @type string */(formData.get('copper'))),
    };

    const transaction = /** @type ('receive' | 'spend' | 'transfer') */(formData.get('transaction'));

    if (transaction === 'receive') {
      this.transactionReceive(coinage);
    } else if (transaction === 'spend') {
      this.transactionSpend(coinage);
    } else if (transaction === 'transfer') {
      this.transactionTransfer(coinage, /** @type (BlackFlagActor['id'] | null) */(formData.get('actors')));
    }
  };

  /**
   * @param {Coinage} coinage
   */
  async transactionReceive(coinage) {
    await upsertActorCoinage(this.actor, coinage);
  }

  /**
   * @param {Coinage} coinage
   */
  async transactionSpend(coinage) {
    const actorCoinage = await getActorCoinage(this.actor);

    try {
      const newCoinage = spendCoinage(actorCoinage, coinage);
      await upsertActorCoinage(this.actor, newCoinage, 'set');
    } catch (e) {
      if (e instanceof NotEnoughMoneyError) {
        ui.notifications?.error('You do not have enough money to spend.');
      }
    }
  }

  /**
   * @param {Coinage} coinage
   * @param {BlackFlagActor['id'] | null} target
   */
  async transactionTransfer(coinage, target) {
    if (!target) {
      ui.notifications?.warn('Party member not selected');
    }

    const targetActor = game.actors?.get(/** @type string */(target));
    if (!targetActor) {
      ui.notifications?.error(`Invalid actor id: ${target}`);
    }

    const activeGmId = getActiveGMs()[0].id;

    game.socket?.emit(`module.${MODULE_ID}`, {
      type: 'transfer-currency',
      payload: {},
      recipients: [activeGmId],
    });

    const actorCoinage = await getActorCoinage(this.actor);

    try {
      const newCoinage = spendCoinage(actorCoinage, coinage);
      await upsertActorCoinage(/** @type BlackFlagActor */(targetActor), newCoinage, 'update');
    } catch (e) {
      if (e instanceof NotEnoughMoneyError) {
        ui.notifications?.error('You do not have enough money to transfer.');
      }
    }
  }

  async getData() {
    return {
      actor: this.actor,
      currencies: currencyList,
      hasGM: !!game.user?.isGM || getActiveGMs().length > 0,
      fellows: getPCActorsInSameFolder(this.actor).map((actor) => {
        return {
          id: actor.id,
          name: actor.name,
          img: actor.img,
          isGM: !!game.user?.isGM,
        };
      }),
    };
  }

  /**
   * @param {{actor: BlackFlagActor}} actor
   * @returns {Promise<CurrencyManagementApp>}
   */
  static async showApp({actor}) {
    CurrencyInputElement.register();
    ActorSelectorElement.register();

    const app = new CurrencyManagementApp({actor});
    app.render(true);

    return app;
  }

  /**
   * @param {string} actorId
   */
  static async showAppForActorId(actorId) {
    const actor = game.actors?.get(actorId);
    if (!actor) {
      ui.notifications?.error(`No actor with id ${actorId} found`);
      return;
    }

    return CurrencyManagementApp.showApp({actor: /** @type BlackFlagActor */(actor)});
  }
}
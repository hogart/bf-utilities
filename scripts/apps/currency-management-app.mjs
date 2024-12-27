import { currencyList, getActorCoinage, upsertActorCoinage } from '../lib/actor-currency.mjs';
import { getPCActorsInSameFolder } from '../lib/actor.mjs';
import { NotEnoughMoneyError, spendCoinage } from '../lib/currency.mjs';
import { getPath } from '../lib/tpl.mjs';

// @ts-expect-error wrong typings?
export class CurrencyManagementApp extends Application {
  /**
   * @param {{ actor: BlackFlagActor; isOwner: boolean; }} params
   */
  constructor(params, options = {}) {
    super(options);
    /** @type BlackFlagActor */
    this.actor = params.actor;
    this.isOwner = params.isOwner;
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
      fellows: getPCActorsInSameFolder(this.actor).map((actor) => {
        return {
          id: actor.id,
          name: actor.name,
          img: actor.img,
        };
      }),
    };
  }
}
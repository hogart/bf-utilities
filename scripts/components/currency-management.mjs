import { ActorSelectorElement } from './actor-selector.mjs';
import { BaseElement } from './base.mjs';
import { CurrencyInputElement } from './currency-input.mjs';
import { currencyList, getActorCoinage, upsertActorCoinage } from '../lib/actor-currency.mjs';
import { getPCActorsInSameFolder } from '../lib/actor.mjs';
import { NotEnoughMoneyError, spendCoinage } from '../lib/currency.mjs';
import { requestCurrencyTransfer } from '../lib/currency-socket.mjs';
import { getActiveGMs } from '../lib/get-active-gms.mjs';

/** @param {unknown} value */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class CurrencyManagementElement extends BaseElement {
  /** @type {string} */ actorId = '';

  static properties = {
    actorId: {type: String, reflect: true},
  };

  static elements = [CurrencyInputElement, ActorSelectorElement];

  events = {
    'submit form': (/** @type {Event} */event) => this.#onSubmit(event),
    'change select[name="transaction"]': (/** @type {Event} */event) => this.#onTransactionChange(event),
  };

  styles = /* css */`
    select {
      height: var(--input-height);
    }
  `;


  /** @returns {BlackFlagActor | undefined} */
  get actor() {
    return /** @type {BlackFlagActor | undefined} */(game.actors?.get(this.actorId));
  }

  /**
   * @param {BlackFlagActor[]} fellows
   */
  #renderFellows(fellows) {
    return fellows.map((fellow) => /* html */`
      <bfu-actor-selector
        actor-id="${escapeHtml(fellow.id)}"
        name="${escapeHtml(fellow.name)}"
        img="${escapeHtml(fellow.img)}"
      ></bfu-actor-selector>
    `).join('');
  }

  /**
   * @param {typeof currencyList[number]} currency
   */
  #renderCurrencyInput(currency) {
    return /* html */`
      <bfu-currency-input
        amount="0"
        name="${escapeHtml(currency.name)}"
        img="${escapeHtml(currency.img)}"
        label="${escapeHtml(currency.label)}"
      ></bfu-currency-input>
    `;
  }

  render() {
    const actor = this.actor;
    if (!actor) {
      return '<p>Actor not found.</p>';
    }

    const hasGM = !!game.user?.isGM || getActiveGMs().length > 0;
    const fellows = getPCActorsInSameFolder(actor);

    return /* html */`
      <form class="currency-management bf-utilities-form black-flag">
        <fieldset>
          <legend>How much money?</legend>
          ${currencyList.map(this.#renderCurrencyInput).join('')}
        </fieldset>

        <fieldset>
          <legend>Transaction type</legend>

          <div class="form-group">
            <select name="transaction">
              <option value="receive" selected>Receive</option>
              <option value="spend">Spend</option>
              <option value="transfer" ${(!hasGM || !fellows.length) ? 'disabled' : ''}>Transfer</option>
            </select>
          </div>
        </fieldset>

        <fieldset class="transferTo" hidden>
          <legend>Transfer to:</legend>
          ${this.#renderFellows(fellows)}
        </fieldset>

        <div class="actions">
          <button type="submit">Confirm</button>
        </div>
      </form>
    `;
  }

  #onSubmit = (/** @type {Event} */event) => {
    event.preventDefault();

    const formData = new FormData(/** @type {HTMLFormElement} */(event.target));
    /** @type {Coinage} */
    const coinage = {
      pp: parseFloat(/** @type {string} */(formData.get('platinum'))),
      gp: parseFloat(/** @type {string} */(formData.get('gold'))),
      sp: parseFloat(/** @type {string} */(formData.get('silver'))),
      cp: parseFloat(/** @type {string} */(formData.get('copper'))),
    };

    const transaction = /** @type {'receive' | 'spend' | 'transfer'} */(formData.get('transaction'));
    /** @type {Promise<boolean>} */
    let result = Promise.resolve(false);
    if (transaction === 'receive') {
      result = this.transactionReceive(coinage);
    } else if (transaction === 'spend') {
      result = this.transactionSpend(coinage);
    } else if (transaction === 'transfer') {
      result = this.transactionTransfer(coinage, /** @type {BlackFlagActor['id'] | null} */(formData.get('actors')));
    }

    void result.then((success) => {
      if (success) {
        this.fire('transactiondone');
      }
    });
  };

  #onTransactionChange = (/** @type {Event} */event) => {
    const select = /** @type {HTMLSelectElement} */(event.target);
    const /** @type {HTMLFieldSetElement | null} */ transferFieldset = this.querySelector('fieldset.transferTo');
    if (transferFieldset) {
      transferFieldset.hidden = select.value !== 'transfer';
    }
  };

  /**
   * @param {Coinage} coinage
   * @returns {Promise<boolean>}
   */
  async transactionReceive(coinage) {
    const actor = this.actor;
    if (!actor) {
      return false;
    }
    await upsertActorCoinage(actor, coinage);
    return true;
  }

  /**
   * @param {Coinage} coinage
   * @returns {Promise<boolean>}
   */
  async transactionSpend(coinage) {
    const actor = this.actor;
    if (!actor) {
      return false;
    }

    const actorCoinage = await getActorCoinage(actor);

    try {
      const newCoinage = spendCoinage(actorCoinage, coinage);
      await upsertActorCoinage(actor, newCoinage, 'set');
      return true;
    } catch (e) {
      if (e instanceof NotEnoughMoneyError) {
        ui.notifications?.error('You do not have enough money to spend.');
      }
      return false;
    }
  }

  /**
   * @param {Coinage} coinage
   * @param {BlackFlagActor['id'] | null} target
   * @returns {Promise<boolean>}
   */
  async transactionTransfer(coinage, target) {
    if (!target) {
      ui.notifications?.warn('Party member not selected');
      return false;
    }

    const targetActor = /** @type {BlackFlagActor | undefined} */(game.actors?.get(target));
    if (!targetActor) {
      ui.notifications?.error(`Invalid actor id: ${target}`);
      return false;
    }

    const actor = this.actor;
    if (!actor) {
      return false;
    }

    return requestCurrencyTransfer(actor, targetActor, coinage);
  }
}

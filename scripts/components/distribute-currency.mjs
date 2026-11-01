import { BaseElement } from './base.mjs';
import { ActorSelectorElement } from './actor-selector.mjs';
import { CurrencyInputElement } from './currency-input.mjs';
import { currencyList } from '../lib/actor-currency.mjs';
import { escapeHtml } from '../lib/tpl.mjs';

export class DistributeCurrencyElement extends BaseElement {
  /** @type {{id: string, name: string, img: string}[]} */ actors = [];

  static properties = {
    actors: { type: Array, reflect: true },
  };

  static elements = [ActorSelectorElement, CurrencyInputElement];

  render() {
    const currencies = currencyList.map((currency) => /* html */`
      <bfu-currency-input
        amount="0"
        name="${escapeHtml(currency.name)}"
        img="${escapeHtml(currency.img)}"
        label="${escapeHtml(currency.label)}"
      ></bfu-currency-input>
    `).join('');

    const actors = (this.actors || []).map((actor) => /* html */`
      <bfu-actor-selector
        actor-id="${escapeHtml(actor.id)}"
        name="${escapeHtml(actor.name)}"
        img="${escapeHtml(actor.img)}"
      ></bfu-actor-selector>
    `).join('');

    return /* html */`
      <div class="bf-utilities-form black-flag">
        <fieldset>
          <legend>How much money?</legend>
          ${currencies}
        </fieldset>
        <fieldset>
          <legend>Distribute between:</legend>
          ${actors}
        </fieldset>
        <fieldset>
          <legend>Method</legend>
          <div class="form-group distribute-methods">
            <label
              data-tooltip="Entire sum will be exchanged to highest possible denomination and distributed evenly. Overflow coppers may fall to first few people. This works in cities."
            >
              <input name="method" type="radio" value="exchange" checked/>
              With access to exchange service
            </label>
            <label
              data-tooltip="Each denomination will be evenly divided separately. The rest will be exchanged and then distributed, as if with the access to exchange. This is intended for wilderness."
            >
              <input name="method" type="radio" value="wilderness"/>
              No exchange service available
            </label>
          </div>
        </fieldset>
        <p>Use negative values if you need characters to spend money.</p>
      </div>
    `;
  }
}

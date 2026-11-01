import { BaseElement } from './base.mjs';

export class CurrencyInputElement extends BaseElement {
  /** @type {number} */ actorId = 0;

  /** @type {string} */ name = '';
  /** @type {string} */ label = '';
  /** @type {string} */ img = '';

  static properties = {
    amount: { type: Number, reflect: true },

    name: { type: String, reflect: true },
    label: { type: String, reflect: true },
    img: { type: String, reflect: true },
  };

  styles = /* css */`
    .currency-input {
      margin-bottom: 1ch;

      label {
        flex-direction: row;
        align-items: center;
        gap: 1ch;
        margin-bottom: 0.25ch;
      }

      input {
        flex: 1;
      }

      img {
        height: 1.2rem;
      }
    }
  `;

  render() {
    return /* html */`
      <div class="form-group currency-input">
        <label for="${this.name}">
          <img src="${this.img}" alt="" aria-hidden="true"/>
          ${this.label}
        </label>
        <input type="number" id="${this.name}" name="${this.name}" value="0" step="1"/>
      </div>
    `;
  }
}
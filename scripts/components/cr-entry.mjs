import { xpTable } from '../lib/cr-table.mjs';
import { BaseElement } from './base.mjs';

export class CrEntryElement extends BaseElement {
  /** @type {string} */ cr = '';
  /** @type {number} */ quantity = 0;

  static properties = {
    cr: { type: String, reflect: true },
    quantity: { type: Number, reflect: true },
  };

  styles = /* css */`
    .remove-creature-btn {
      flex-grow: 0;
      height: var(--form-field-height);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px 0;
    }

    .creature-group {
      gap: 1ch;

      label:has(button) {
        flex: 1;
      }
    }
  `;

  events = {
    'click .remove-creature-btn': () => {
      this.fire('remove');
    },
  };

  get value() {
    const xp = /** @type {HTMLSelectElement} */ (this.querySelector('select[name="cr"]'))?.value ?? 0;
    const quantity = /** @type {HTMLInputElement} */ (this.querySelector('input[name="quantity"]')).valueAsNumber || 0;
    if (xp && quantity) {
      return parseInt(xp) * quantity;
    } else {
      return 0;
    }
  }

  /**
   * @param {{ xp: number; cr: string; }} option
   */
  #renderOption = (option) => {
    const selected = option.cr === this.cr;
    return /* html */`
      <option value="${option.xp}" ${selected ? 'selected' : ''}>
        ${option.cr} (${option.xp})
      </option>
    `;
  };

  render() {
    return /* html */`
      <div class="form-group creature-group">
        <label>
          CR:
          <select name="cr">
            <option value="">—</option>
            ${xpTable.map(this.#renderOption)}
          </select>
        </label>
        <label>
          Quantity:
          <input type="number" name="quantity" min="1" value="${this.quantity}"/>
        </label>
        <label>
          &nbsp;
          <button type="button" class="remove-creature-btn" title="Remove the creature">
            <i class="fas fa-trash"></i>
          </button>
        </label>
      </div>
    `;
  }
}
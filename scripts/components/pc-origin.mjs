import { BaseElement } from './base.mjs';
import { FeatureLinkElement } from './feature-link.mjs';

export class PcOriginElement extends BaseElement {
  /** @type {BlackFlagItem | null} */ heritage = null;
  /** @type {BlackFlagItem | null} */ lineage = null;
  /** @type {BlackFlagItem | null} */ background = null;
  /** @type {BlackFlagItem[] | null} */ talents = null;

  static properties = {
    heritage: { type: Object, reflect: true },
    lineage: { type: Object, reflect: true },
    background: { type: Object, reflect: true },
    talents: { type: Array, reflect: true },
  };

  static elements = [
    FeatureLinkElement,
  ];


  styles = /* css */`
    .origin {
      font-size: 85%;
      opacity: 0.75;
    }
  `;

  events = {
    'click [data-compendium]': (/** @type {Event} */ _event, /** @type {HTMLElement} */ target) => {
      this.fire('compendium', target.dataset.item);
    },
  };

  /**
   * @param {BlackFlagItem | null} item
   * @returns {string}
   */
  renderOrigin(item) {
    if (!item) {
      return '-unset-';
    }
    return /* html */`<bfu-feature-link label="${item.name}" item-id="${item._id}"></bfu-feature-link>`;
  }

  render() {
    const talents = this.talents?.length
      ? `(${this.talents.map(this.renderOrigin).join(', ')})`
      : '';

    return /* html */`
      <div class="origin">
        ${this.renderOrigin(this.heritage)}
        ${this.renderOrigin(this.lineage)},
        ${this.renderOrigin(this.background)}
        ${talents}
      </div>
    `;
  }
}
import { BaseElement } from './base.mjs';

export class FeatureLinkElement extends BaseElement {
  /** @type {string} */ itemId = '';
  /** @type {string} */ label = '';
  /** @type {string} */ img = '';
  /** @type {string} */ alt = '';

  static properties = {
    itemId: { type: String, reflect: true },
    label: { type: String, reflect: true },
    img: { type: String, reflect: true },
    alt: { type: String, reflect: true },
  };


  styles = /* css */`
    a[data-feature] {
      display: inline-flex;
      align-items: center;

      img {
        height: 1.2rem;
        margin-right: 1ch;
      }
    }
  `;

  events = {
    'click [data-feature]': (/** @type {Event} */ _event, /** @type {HTMLElement} */ target) => {
      this.fire('openfeature', target.dataset.feature);
    },
  };

  render() {
    const img = this.img ? `<img src="${this.img}" alt="${this.alt}"/>` : '';
    return /* html */`
      <a data-feature="${this.itemId}">${img}${this.label}</a>
    `.trim();
  }
}
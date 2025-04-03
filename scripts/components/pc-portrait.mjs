import { BaseElement } from './base.mjs';

export class PcPortraitElement extends BaseElement {
  /** @type {string} */ actorId = '';
  /** @type {string} */ name = '';
  /** @type {string} */ img = '';
  /** @type {string} */ senses = '';
  /** @type {string} */ type = '';
  /** @type {string} */ size = '';
  /** @type {string} */ movement = '';

  static properties = {
    actorId: { type: String, reflect: true },
    name: { type: String, reflect: true },
    img: { type: String, reflect: true },
    senses: { type: String, reflect: true },
    type: { type: String, reflect: true },
    size: { type: String, reflect: true },
    movement: { type: String, reflect: true },
  };

  styles = /* css */`
    .portrait-wrapper {
      position: relative;

      .marker {
        position: absolute;

        > i {
          text-shadow: 0 0 2px gray;
        }
      }

      .senses {
        left: 0;
        top: 0;
      }

      .movement {
        right: 0;
        top: 0;
      }

      .size {
        left: 0;
        bottom: 0;
      }

      .type {
        right: 0;
        bottom: 0;
      }
    }
  `;

  events = {
    'click img': () => {
      this.fire('opensheet', this.actorId);
    },
  };

  /**
   * @param {'senses'|'type'|'size'|'movement'} propertyName
   * @param {string} icon
   * @returns {string}
   */
  #renderIcon(propertyName, icon) {
    if (!this[propertyName]) {
      return '';
    }

    return /* html */`
      <div class="marker ${propertyName}" title="${this[propertyName]}">
        <i class="fa-solid fa-${icon}"></i>
      </div>
    `;
  }

  render() {
    return /* html */`
      <div class="portrait-wrapper">
        <img src="${this.img}" alt="${this.name}"/>

        ${this.#renderIcon('senses', 'eye')}
        ${this.#renderIcon('type', 'person')}
        ${this.#renderIcon('size', 'ruler')}
        ${this.#renderIcon('movement', 'feather')}
      </div>
    `;
  }
}
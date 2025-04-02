import { BaseElement } from './base.mjs';

export class ActorSelectorElement extends BaseElement {
  /** @type {string} */ actorId = '';
  /** @type {string} */ name = '';
  /** @type {string} */ img = '';
  /** @type {boolean} */ isRadio = false;

  static properties = {
    actorId: { type: String, reflect: true },
    name: { type: String, reflect: true },
    img: { type: String, reflect: true },
    isRadio: { type: Boolean, reflect: true },
  };

  styles = /* css */`
    label.character {
      flex-direction: row;
      gap: 1ch;
      align-items: center;

      img {
        height: 2.5rem;
        border: 0 none;
      }
    }
  `;

  render() {
    return /* html */`
      <div class="form-group">
        <label class="character">
          <input
            name="actors"
            value="${this.actorId}"
            type="${this.isRadio ? 'radio' : 'checkbox'}"
            ${this.isRadio ? '' : 'checked'}
          />
          <img src="${this.img}" alt="${this.name}"/>
          ${this.name}
        </label>
      </div>
    `;
  }
}
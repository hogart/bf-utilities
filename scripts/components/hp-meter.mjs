import { BaseElement } from './base.mjs';

export class HpMeterElement extends BaseElement {
  /** @type {number} */ current = 0;
  /** @type {number} */ max = 0;
  /** @type {number} */ thp = 0;
  /** @type {boolean} */ isGm = false;
  /** @type {boolean} */ isOwner = false;

  static properties = {
    current: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    thp: { type: Number, reflect: true },
    isGm: { type: Boolean, reflect: true },
    isOwner: { type: Boolean, reflect: true },
  };

  styles = /* css */`
    position: relative;
    width: 100%;
    height: 1rem;
    border: 1px solid var(--bf-color-border-blue);
    border-radius: 4px;

    .fill {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      border-radius: 2px;
    }

    .number {
      position: absolute;
      width: 100%;
      top: 50%;
      transform: translateY(-50%);
      text-align: center;
      font-size: 0.7rem;
      color: black;
      text-shadow: 0 0 2px silver;
    }
  `;

  renderNumbers() {
    if (this.isGm || this.isOwner) {
      return /* html */`<div class="number">
        ${this.current}${this.thp ? `+${this.thp}` : ''}/${this.max}
      </div>`;
    } else {
      return '';
    }
  }

  render() {
    const filledIn = ((this.current + this.thp) / this.max);
    const percent = filledIn * 100;
    const hue = filledIn * 120; // 0 = red, 120 = green
    const lightness = 20 + filledIn * 40; // range 20% to 60%
    const color = `hsl(${hue}, 80%, ${lightness}%)`;

    return /* html */`
      <div class="fill" style="width: ${percent}%; background-color: ${color}"></div>
      ${this.renderNumbers()}
    `;
  }
}
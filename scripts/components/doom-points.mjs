import { BaseElement } from './base.mjs';

export class DoomPointsElement extends BaseElement {
  /** @type {number} */ points = 0;

  static properties = {
    points: { type: Number, reflect: true },
  };

  styles = /* css */`
    .doom-points {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      [disabled] {
        pointer-events: none;
        opacity: 0.4;
      }
    }
  `;

  render() {
    if (isNaN(this.points)) {
      return /* html */`
        <div class="doom-points">
          <span data-tooltip="Create an NPC called _partyData to use Doom points">
            <i class="fas fa-circle-exclamation"></i>
          </span>
        </div>
      `;
    }

    return /* html */`
      <div class="doom-points">
        <a data-tooltip="Spend Doom" data-spend ${this.points ? '' : 'disabled'}>
          <i class="fas fa-minus"></i>
        </a>
        <span data-tooltip="Current Doom points">
          <i class="fas fa-skull"></i>
          ${this.points}
        </span>
        <a data-tooltip="Gain Doom" data-gain>
          <i class="fas fa-plus"></i>
        </a>
      </div>
    `;
  }

  events = {
    'click [data-spend]': () => {
      this.points--;
      this.fire('doom', {points: this.points});
    },
    'click [data-gain]': () => {
      this.points = this.points + 1;
      this.fire('doom', {points: this.points});
    },
  };
}

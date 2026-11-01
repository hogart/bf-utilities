import { BaseElement } from './base.mjs';
import { ActorSelectorElement } from './actor-selector.mjs';
import { CrEntryElement } from './cr-entry.mjs';
import { escapeHtml } from '../lib/tpl.mjs';

export class GrantXpElement extends BaseElement {
  /** @type {{id: string, name: string, img: string}[]} */ actors = [];
  /** @type {{cr: string, count: number}[]} */ battlefieldXp = [];

  static properties = {
    actors: { type: Array, reflect: true },
    battlefieldXp: { type: Array, reflect: true },
  };

  static elements = [ActorSelectorElement, CrEntryElement];

  events = {
    'click .add-creature-btn': () => {
      this.querySelector('#creature-section')?.insertAdjacentHTML(
        'beforeend',
        '<bfu-cr-entry cr="" quantity="0"></bfu-cr-entry>',
      );
    },
    'remove bfu-cr-entry': (/** @type {Event} */_event, /** @type {HTMLElement} */target) => {
      target.remove();
    },
  };

  styles = /* css */`
    .remove-creature-btn {
      flex-grow: 0;
      height: var(--input-height);
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

    select {
      height: var(--input-height);
    }
  `;

  render() {
    const creatures = (this.battlefieldXp || []).map((entry) => /* html */`
      <bfu-cr-entry cr="${escapeHtml(entry.cr)}" quantity="${Number(entry.count) || 0}"></bfu-cr-entry>
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
          <legend>How much XP?</legend>

          <div class="form-group">
            <label for="plainXp">
              Plain XP:
              <input type="number" id="plainXp" name="plainXp" value="0" step="1"/>
            </label>
          </div>

          <div id="creature-section">
            ${creatures}
            <bfu-cr-entry cr="" quantity="0"></bfu-cr-entry>
          </div>
          <button type="button" class="add-creature-btn">
            <i class="fas fa-add"></i>
            Add creature
          </button>
        </fieldset>

        <fieldset>
          <legend>To this characters:</legend>
          ${actors}
        </fieldset>

        <fieldset data-tooltip="Currently isn't displayed">
          <legend>Log entry</legend>
          <div class="form-group">
            <label for="entry">Text:</label>
            <input type="text" id="entry" name="source"/>
          </div>
        </fieldset>
      </div>
    `;
  }
}

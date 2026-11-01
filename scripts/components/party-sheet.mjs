import { BaseElement } from './base.mjs';
import { DoomPointsElement } from './doom-points.mjs';
import { PcPortraitElement } from './pc-portrait.mjs';
import { PcSkillsElement } from './pc-skills.mjs';
import { PcOriginElement } from './pc-origin.mjs';
import { FeatureLinkElement } from './feature-link.mjs';
import { HpMeterElement } from './hp-meter.mjs';
import { escapeHtml } from '../lib/tpl.mjs';

/**
 * Renders the party sheet. All interactions are re-fired as bubbling custom events,
 * the host application is responsible for handling them.
 */
export class PartySheetElement extends BaseElement {
  /** @type {PartySheetData | null} */ data = null;

  static properties = {
    data: { type: Object, reflect: true },
  };

  static elements = [
    DoomPointsElement,
    PcPortraitElement,
    PcSkillsElement,
    PcOriginElement,
    FeatureLinkElement,
    HpMeterElement,
  ];

  events = {
    'click [data-open-sheet]': (/** @type {Event} */_event, /** @type {HTMLElement} */target) => {
      this.fire('opensheet', target.dataset.openSheet);
    },
    'click [data-remove-luck]': (/** @type {Event} */_event, /** @type {HTMLElement} */target) => {
      this.fire('luck', {actorId: target.dataset.removeLuck, delta: -1});
    },
    'click [data-grant-luck]': (/** @type {Event} */_event, /** @type {HTMLElement} */target) => {
      this.fire('luck', {actorId: target.dataset.grantLuck, delta: 1});
    },
    'click [data-manage-currency]': (/** @type {Event} */_event, /** @type {HTMLElement} */target) => {
      this.fire('managecurrency', target.dataset.manageCurrency);
    },
    'click [data-action]': (/** @type {Event} */_event, /** @type {HTMLElement} */target) => {
      this.fire('partyaction', target.dataset.action);
    },
  };

  /**
   * @param {unknown} value
   * @returns {string}
   */
  #json(value) {
    return escapeHtml(JSON.stringify(value));
  }

  /**
   * @param {ActorTplData} actor
   * @param {PartySheetData} data
   * @returns {string}
   */
  #renderActor(actor, data) {
    const id = escapeHtml(actor._id);
    const classes = actor.classes.map((cls) => /* html */`
      <bfu-feature-link
        img="${escapeHtml(cls.img)}"
        alt="${escapeHtml(cls.name)}"
        item-id="${escapeHtml(cls._id)}"
        label="${escapeHtml(cls.name)} ${escapeHtml(cls.levels)}"
      ></bfu-feature-link>
    `).join('');

    const canManageCurrency = actor.isOwner || data.isGM;

    return /* html */`
      <li class="pc-item ${actor.isOwner ? 'isOwner' : ''}" data-actor-id="${id}">
        <div class="pc-portrait">
          <bfu-pc-portrait
            name="${escapeHtml(actor.name)}"
            img="${escapeHtml(actor.img)}"
            actor-id="${id}"
            senses="${escapeHtml(actor.senses)}"
            type="${escapeHtml(actor.type)}"
            size="${escapeHtml(actor.size)}"
            movement="${escapeHtml(actor.movement)}"
          ></bfu-pc-portrait>

          <bfu-hp-meter
            max="${escapeHtml(actor.hp.max)}"
            current="${escapeHtml(actor.hp.value)}"
            thp="${escapeHtml(actor.hp.thp)}"
            ${data.isGM ? 'is-gm' : ''}
            ${actor.isOwner ? 'is-owner' : ''}
          ></bfu-hp-meter>

          <div class="protection">
            <span title="AC: ${escapeHtml(actor.ac.label)}">
              <i class="fas fa-shield-halved"></i>
              ${escapeHtml(actor.ac.value)}
            </span>
            <span title="Hit Dice">
              <i class="fas fa-campground"></i>
              ${escapeHtml(actor.hd.available)}/${escapeHtml(actor.hd.max)}
            </span>
          </div>
        </div>
        <div class="pc-info">
          <div class="pc-header">
            <a class="name" data-open-sheet="${id}">${escapeHtml(actor.name)}</a>

            <p class="character-classes">${classes}</p>
          </div>

          <bfu-pc-origin
            heritage="${this.#json(actor.heritage)}"
            lineage="${this.#json(actor.lineage)}"
            background="${this.#json(actor.background)}"
            talents="${this.#json(actor.talents)}"
          ></bfu-pc-origin>

          <bfu-pc-skills skills="${this.#json(actor.highestSkills)}"></bfu-pc-skills>

          <div class="misc">
            <span title="Luck" class="luck">
              <a data-remove-luck="${id}" title="Remove luck point" class="gm-only owner-only">
                <i class="fas fa-minus"></i>
              </a>
              <i class="fas fa-clover"></i>
              ${escapeHtml(actor.luck)}
              <a data-grant-luck="${id}" title="Add luck point" class="gm-only owner-only">
                <i class="fas fa-plus"></i>
              </a>
            </span>
            <span title="Attuned Items">
              <i class="fa-solid fa-sun"></i>
              ${escapeHtml(actor.attunement.value)}/${escapeHtml(actor.attunement.max)}
            </span>
            <span title="Wealth: ${escapeHtml(actor.coinage)}">
              <a data-manage-currency="${id}" class="luck ${canManageCurrency ? 'active' : ''}">
                <i class="fas fa-coins"></i>
              </a>
              ${escapeHtml(actor.wealth)}
            </span>
          </div>
        </div>
      </li>
    `;
  }

  render() {
    const data = this.data;
    if (!data) {
      return '';
    }

    const rootClasses = [
      'party-sheet',
      data.isGM ? 'isGM' : '',
      data.enableDistributeCurrency ? 'enable-distribute-currency' : '',
      data.enableGrantXp ? 'enable-grant-xp' : '',
      data.enableDoomPoints ? 'enable-doom-points' : '',
      'black-flag',
    ].filter(Boolean).join(' ');

    const actions = data.isGM ? /* html */`
      <div class="actions">
        <button class="action" data-action="distribute-currency">
          <i class="fas fa-coins"></i>
          Distribute currency
        </button>

        <button class="action" data-action="grant-xp">
          <i class="fa-solid fa-arrow-down-up-across-line"></i>
          Grant XP
        </button>

        <bfu-doom-points class="action" points="${data.doomPoints ?? 'NaN'}"></bfu-doom-points>
      </div>
    ` : '';

    return /* html */`
      <div class="${rootClasses}">
        ${actions}
        <ul class="pc-items">
          ${data.actors.map((actor) => this.#renderActor(actor, data)).join('')}
        </ul>
      </div>
    `;
  }
}

import { BaseElement } from './base.mjs';

export class PcSkillsElement extends BaseElement {
  /** @type {Array<ActorTplHighSkill>} */ skills = [];

  static properties = {
    skills: { type: Array, reflect: true },
  };

  styles = /* css */`
    .pc-skills {
      list-style: none;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      font-size: 10px;
      padding-left: 0;
      padding-top: 0.5ch;
      border-top: 1px solid var(--bf-border-color-blue);
      border-bottom: 1px solid var(--bf-border-color-blue);

      li:has(+ li) {
        margin-right: 1ch;
      }

      .proficiency-selector {
        display: inline-block;
        vertical-align: middle;

        blackFlag-icon {
          height: 10px;
          width: 10px;
        }

        &:is([data-multiplier="1"], [data-multiplier="2"]) {
          --top-color: var(--proficient-color);
          --bottom-color: var(--proficient-color);
        }
        &[data-multiplier="2"] {
          --side-color: var(--proficient-color);
        }
        &[data-multiplier="0.5"][data-rounding="up"] {
          --top-color: var(--proficient-color);
        }
        &[data-multiplier="0.5"][data-rounding="down"] {
          --bottom-color: var(--proficient-color);
        }
      }
    }
  `;

  /**
   * @param {ActorTplHighSkill} skill
   * @returns {string}
   */
  #renderSkill(skill) {
    const label = game.i18n?.localize(skill.label);

    return /* html */`
      <li>
        <div class="proficiency-selector" data-multiplier="${skill.proficiencyLevel}" data-rounding="down" aria-label="${label}">
          <blackFlag-icon src="systems/black-flag/artwork/interface/proficiency.svg" inert></blackFlag-icon>
        </div>
        ${label}
        ${skill.mod}
      </li>
    `;
  }

  render() {
    return /* html */`
      <ul class="pc-skills">
        ${this.skills.map(this.#renderSkill).join('')}
      </ul>
    `;
  }
}
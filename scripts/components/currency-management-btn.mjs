import { CurrencyManagementApp } from '../apps/currency-management-app.mjs';
import { BaseElement } from './base.mjs';

export class CurrencyManagementBtnElement extends BaseElement {
  /** @type {string} */ actorId = '';

  static properties = {
    actorId: { type: String, reflect: true },
  };

  events = {
    'click a': (/** @type {Event} */event) => {
      event.stopPropagation();
      CurrencyManagementApp.showAppForActorId(this.actorId);
    },
  };

  render() {
    return /* html */`
      <a class="currency-management">
        <i class="fas fa-coins" title="Manage currency"></i>
      </a>
    `;
  }
}
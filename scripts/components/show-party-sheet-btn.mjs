import { PartySheetApp } from '../apps/party-sheet-app.mjs';
import { BaseElement } from './base.mjs';

export class ShowPartySheetBtnElement extends BaseElement {
  /** @type {string} */ folderId = '';

  static properties = {
    folderId: { type: String, reflect: true },
  };

  styles = /* css */`
    flex: 0;
  `;

  events = {
    'click a': (/** @type {Event} */event) => {
      event.stopPropagation();
      PartySheetApp.showPartySheetForFolder(this.folderId);
    },
  };

  render() {
    return /* html */`
      <a class="create-button party-sheet-button">
        <i class="fas fa-users" title="Party sheet"></i>
      </a>
    `;
  }
}
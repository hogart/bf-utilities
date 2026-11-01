import { CurrencyManagementElement } from '../components/currency-management.mjs';

const {ApplicationV2} = foundry.applications.api;

export class CurrencyManagementApp extends ApplicationV2 {
  /**
   * @param {{ actor: BlackFlagActor }} params
   */
  constructor(params, options = {}) {
    super(options);
    /** @type BlackFlagActor */
    this.actor = params.actor;
  }

  static DEFAULT_OPTIONS = {
    id: 'currency-management-app',
    classes: ['bf-utilities', 'currency-management-app'],
    window: {
      title: 'Currency Management',
      resizable: true,
    },
    position: {
      width: 640,
      height: /** @type {'auto'} */ ('auto'),
    },
  };

  /**
   * @returns {Promise<HTMLElement>}
   */
  async _renderHTML() {
    CurrencyManagementElement.register();

    const element = document.createElement('bfu-currency-management');
    element.setAttribute('actor-id', this.actor.id ?? '');
    element.addEventListener('transactiondone', () => {
      void this.close();
    });
    return element;
  }

  /**
   * @param {HTMLElement} result
   * @param {HTMLElement} content
   */
  _replaceHTML(result, content) {
    content.replaceChildren(result);
  }

  /*
   * Keep this as an explicit context hook so the ApplicationV2 lifecycle has a
   * stable context even though this app renders a custom element directly.
   */
  async _prepareContext() {
    return {};
  }

  /**
   * @param {{actor: BlackFlagActor}} actor
   * @returns {Promise<CurrencyManagementApp>}
   */
  static async showApp({actor}) {
    const app = new CurrencyManagementApp({actor});
    void app.render(true);

    return app;
  }

  /**
   * @param {string} actorId
   */
  static async showAppForActorId(actorId) {
    const actor = game.actors?.get(actorId);
    if (!actor) {
      ui.notifications?.error(`No actor with id ${actorId} found`);
      return;
    }

    return CurrencyManagementApp.showApp({actor: /** @type BlackFlagActor */(actor)});
  }
}

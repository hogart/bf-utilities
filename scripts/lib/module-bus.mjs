import { MODULE_ID } from './module-id.mjs';

export const moduleBus = {
  /**
   * @param {any} eventName
   * @param {unknown} data
   */
  trigger(eventName, data) {
    const fullEventName = `${MODULE_ID}.${eventName}`;
    Hooks.callAll(fullEventName, data);
  },

  /**
   * @param {string} eventName
   * @param {(...args: any[]) => void} listener
   * @returns {() => void} unsubscriber function
   */
  listen(eventName, listener) {
    const fullEventName = `${MODULE_ID}.${eventName}`;
    const id = Hooks.on(fullEventName, listener);

    return () => {
      Hooks.off(fullEventName, id);
    };
  },

  /**
   * @param {string} settingName
   * @param {(...args: any[]) => void} listener
   * @returns {() => void} unsubscriber function
   */
  listenSettingChange(settingName, listener) {
    const eventName = `setting.${settingName}`;
    return moduleBus.listen(eventName, listener);
  },
};






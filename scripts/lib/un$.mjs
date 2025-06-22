/**
 * Type-safe unwrapping of jQuery. Only needed while the module should work with Foundry 12 and 13.
 * @param {HTMLElement | JQuery<HTMLElement>} elOrJquery
 * @returns HTMLElement
 */
export function un$(elOrJquery) {
  if (elOrJquery instanceof HTMLElement) {
    return elOrJquery;
  } else if (elOrJquery.length > 0) {
    return elOrJquery[0];
  } else if (elOrJquery === null || elOrJquery === undefined) {
    throw new TypeError('Expected a jQuery object or an HTMLElement, but got null or undefined');
  }
}
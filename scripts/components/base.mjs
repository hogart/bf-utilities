import { toKebab } from '../lib/to-kebab.mjs';

export class BaseElement extends HTMLElement {
  /**
   * @param {string} name
   * @param {unknown?} detail
   */
  fire(name, detail = undefined) {
    const event = new CustomEvent(name, {
      detail,
      bubbles: true,  // Allow it to bubble up the DOM tree
      composed: true, // Allow it to pass Shadow DOM boundaries
    });

    this.dispatchEvent(event);
  }

  /**
   * @type {string}
   */
  styles = '';

  /** @type {Record<string, (event: Event, target: HTMLElement) => void>} */
  events = {};

  /** @type {Record<string, unknown>} */
  #values = {};

  /**
   * @returns {string}
   */
  render() {
    return toKebab(this.constructor.name.replace(/Element$/, ''));
  }

  /** @type {Map<string, EventListener>} */
  #boundEventDelegates = new Map();

  activateListeners() {
    const events = this.events;
    if (!events) {
      return;
    }

    const handlersByType = new Map();

    for (const key of Object.keys(events)) {
      const [type, ...selectorParts] = key.split(' ');
      const selector = selectorParts.join(' ').trim();
      if (!handlersByType.has(type)) {
        handlersByType.set(type, []);
      }
      handlersByType.get(type).push({ selector, handler: events[key] });
    }

    for (const [type, handlers] of handlersByType.entries()) {
      const delegate = (/** @type {Event} */event) => {
        const target = /** @type HTMLElement */ (event.target);
        for (const { selector, handler } of handlers) {
          const match = target.closest(selector);
          if (match && this.contains(match)) {
            handler.call(this, event, match);
          }
        }
      };

      this.addEventListener(type, delegate);
      this.#boundEventDelegates.set(type, delegate);
    }
  }

  connectedCallback() {
    const ctor = /** @type {typeof BaseElement} */ (this.constructor);

    // Define reactive properties
    const props = ctor.properties || {};
    for (const [key, options] of Object.entries(props)) {
      Object.defineProperty(this, key, {
        get() {
          if (options.reflect) {
            const attr = this.getAttribute(toKebab(key));
            return this.#castAttribute(attr, options.type);
          } else {
            return this.#values[key];
          }
        },
        set(value) {
          const attrName = toKebab(key);
          const newValue = this.#stringifyAttribute(value, options.type);
          if (options.reflect) {
            if (options.type === Boolean) {
              if (value) {
                this.setAttribute(attrName, '');
              } else {
                this.removeAttribute(attrName);
              }
            } else {
              this.setAttribute(attrName, newValue);
            }
          } else {
            this.#values[key] = value;
          }
          this.#tryRender();
        },
        configurable: true,
        enumerable: true,
      });
    }

    if (this.styles.trim()) {
      ctor.injectStyles(this.styles);
    }

    this.#tryRender();
    this.activateListeners();
  }

  #tryRender() {
    try {
      const result = this.render.apply(this);
      if (typeof result === 'string') {
        this.innerHTML = result;
      }
    } catch (e) {
      this.innerHTML = /** @type {Error} */(e).message;
    }
  }

  /**
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      const ctor = /** @type {typeof BaseElement} */ (this.constructor);
      const propMap = ctor.properties || {};
      for (const [prop, opts] of Object.entries(propMap)) {
        const attrName = toKebab(prop);
        if (attrName === name) {
          const typedValue = this.#castAttribute(newValue, opts.type);
          this.#values[prop] = typedValue;
          this.#tryRender();
          this.activateListeners();
          break;
        }
      }
    }
  }

  disconnectedCallback() {
    for (const [type, handler] of this.#boundEventDelegates.entries()) {
      this.removeEventListener(type, handler);
    }
    this.#boundEventDelegates.clear();
  }

  static get observedAttributes() {
    const props = this.properties || {};
    return Object.entries(props)
      .filter(([, opts]) => opts.reflect)
      .map(([prop]) => toKebab(prop));
  }

  static register() {
    const kebabized = toKebab(this.name.replace(/Element$/, ''));
    const tagName = `bfu-${kebabized}`;
    if (!customElements.get(tagName)) {
      customElements.define(tagName, this);
    }
  }

  /**
   * @param {string} css
   */
  static injectStyles(css) {
    const styleId = `bfu-style-${this.name.replace(/Element$/, '')}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  /**
   * @param {string|null} value
   * @param {Function} type
   */
  #castAttribute(value, type) {
    if (type === Boolean) {
      return value != null;
    }
    if (type === Number) {
      return Number(value);
    }
    return value;
  }

  /**
   * @param {unknown} value
   * @param {Function} type
   */
  #stringifyAttribute(value, type) {
    if (type === Boolean) {
      return '';
    }

    if (type === Number) {
      return String(value);
    }

    return value;
  }

  /**
   * Subclasses must also declare their reactive props explicitly with JSDoc:
   * @example /** \@type {number} *\/ points;
   * This allows TypeScript to recognize them during development.
   *
   * @type {Record<string, { type: Function, reflect: boolean }>}
   */
  static properties = {};
}

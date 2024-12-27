import { MODULE_ID } from './module-id.mjs';

/**
 * Get template name
 * @param {string} template
 * @returns {string}
 */
export function getPath(template) {
  return `modules/${MODULE_ID}/templates/${template}.hbs`;
}

/**
 * @param {string} template
 * @param {Record<string, unknown>} ctx
 * @returns {Promise<string>}
 */
export async function render(template, ctx) {
  return await renderTemplate(getPath(template), {MODULE_ID, ...ctx});
}


/**
 * @param {string} name
 */
export async function registerPartial(name) {
  const path = getPath(name);
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load partial at ${path}`);
  }
  const templateContent = await response.text();
  Handlebars.registerPartial(name.replaceAll('-', '_'), templateContent);
}
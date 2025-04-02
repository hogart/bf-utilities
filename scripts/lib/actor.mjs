import { MODULE_ID } from './module-id.mjs';
import { isPc } from './utils.mjs';

/**
 * @returns BlackFlagActor[]
 */
export function getPcActors(fromCanvasOnly = false) {
  if (fromCanvasOnly) {
    return canvas?.scene?.tokens.contents.reduce(
      (acc, token) => {
        const actor = /** @type BlackFlagActor|null */(token.actor);
        if (actor && isPc(actor)) {
          acc.push(actor);
        }

        return acc;
      },
      /** @type BlackFlagActor[] */([]),
    ) ?? [];
  }
  const actors = /** @type BlackFlagActor[]|undefined */(game.actors);
  return actors?.filter(isPc) || [];
}

/**
 * @param {BlackFlagActor[]} actors
 * @param {HTMLElement} form
 */
export function getSelectedActors(actors, form) {
  /** @type {NodeListOf<HTMLInputElement>} */
  const checkboxes = form.querySelectorAll('input[name="actors"]:checked');
  const selectedActorIds = [...checkboxes].map(
    (elem) => elem.value,
  );

  // Filter the actors that are selected
  return actors.filter(actor => selectedActorIds.includes(actor.id || ''));
}

/**
 * @param {BlackFlagActor | string} actorOrId
 * @returns {BlackFlagActor[]}
 */
export function getPCActorsInSameFolder(actorOrId) {
  const actor = typeof actorOrId === 'string' ? game.actors?.get(actorOrId) : actorOrId;
  if (!actor) {
    console.warn(`Actor ${actorOrId} not found.`);
    return [];
  }

  // Get the folder of the actor
  const folder = actor.folder;
  if (!folder) {
    console.warn(`Actor ${actorOrId} is not in a folder.`);
    return [];
  }

  // Filter actors in the same folder to only include PC actors
  return /** @type BlackFlagActor[] */ (folder.contents).filter(
    folderActor => isPc(folderActor) && folderActor.id !== actor.id,
  );
}

/**
 * Get or set a custom flag on an actor.
 *
 * If called with 2 arguments: returns the current flag value.
 * If called with 3 arguments: sets the flag and returns the result.
 *
 * @param {BlackFlagActor | undefined} actor The actor to get/set the flag on.
 * @param {string} key The key of the flag to access.
 * @param {unknown} [value] Optional. If provided, the flag will be set to this value.
 * @returns {Promise<unknown> | unknown | null} The flag value, or a promise if setting, or null if actor is missing.
 */
export function manageActorFlag(actor, key, value) {
  if (!MODULE_ID) {
    throw new Error('Cannot set flag');
  }

  if (!actor) {
    return null;
  }

  if (arguments.length === 2) {
    return actor.getFlag(MODULE_ID, key);
  } else {
    // @ts-expect-error incorrect typings
    return actor.setFlag(MODULE_ID, key, value);
  }
}
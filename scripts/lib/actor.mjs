import { isPc } from './utils.mjs';

/**
 * @returns BlackFlagActor[]
 */
export function getPcActors() {
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
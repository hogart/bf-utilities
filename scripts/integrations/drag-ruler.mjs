// Adapted from https://github.com/PepijnMC/ElevationDragRuler

import { MODULE_ID } from '../lib/module-id.mjs';

/**
 * @param {Token} token
 */
function getMovementMode(token) {
  const tokenDocument = token.document;

  const tokenMovement = /** @type {BlackFlagActor} */(tokenDocument.actor).system.traits.movement.types;

  const elevation = tokenDocument.elevation;

  if (elevation > 0 && tokenMovement.fly) {
    return 'fly';
  } else if (elevation < 0) {
    if (tokenMovement.swim) {
      return 'swim';
    } else if (tokenMovement.burrow) {
      return 'burrow';
    }
  } else {
    return 'walk';
  }
};

/**
 * @param {BlackFlagActor | null} actor
 * @returns {BlackFlagActor['system']['attributes']['exhaustion']}
 */
function getExhaustion(actor) {
  return actor?.system.attributes.exhaustion ?? 0;
}

/**
 * @param {BlackFlagActor | null} actor
 * @returns {boolean}
 */
function isDying(actor) {
  return actor?.system.attributes.death.failure === 3;
}

/**
 * @param {BlackFlagActor | null} actor
 * @param {string[]} searchList
 * @returns {boolean}
 */
function hasCondition(actor, searchList) {
  if (!actor) {
    return false;
  }

  for (const condition of searchList) {
    if (actor.statuses.has(condition.toLowerCase())) {
      return true;
    }
  }

  return false;
}

export default (/** @type {Constructor} */ SpeedProvider) => {
  class BlackFlagSpeedProvider extends SpeedProvider {
    //An array of colors to be used by the movement ranges.
    get colors() {
      return [
        { 'id': 'walk', 'default': 0x00FF00, 'name': 'Walking' },
        { 'id': 'fly', 'default': 0x00FFFF, 'name': 'Flying' },
        { 'id': 'swim', 'default': 0x0000FF, 'name': 'Swimming' },
        { 'id': 'burrow', 'default': 0xFFAA00, 'name': 'Burrowing' },
        { 'id': 'climb', 'default': 0xAA6600, 'name': 'Climbing' },
        { 'id': 'dash', 'default': 0xFFFF00, 'name': 'Dashing' },
      ];
    }

    /**
     * This is called by Drag Ruler once when a token starts being dragged.
     * Does not get called again when setting a waypoint.
     * @param {Token} token
     */
    getRanges(token) {
      const tokenDocument = /** @type {BlackFlagTokenDocument} */(token.document);

      const tokenMovement =/** @type {BlackFlagActor} */(tokenDocument.actor)?.system?.traits?.movement.types;

      const movementMode = getMovementMode(token) || 'walk';

      const exhaustion = getExhaustion(/** @type {BlackFlagActor} */(token.actor));

      // Applies various modifiers to the movement speeds of the token depending on its conditions and features.
      // Any of these conditions set a creature's speed to 0.
      const movementRestricted = (
        isDying(/** @type {BlackFlagActor} */(token.actor)) ||
        exhaustion >= 5 ||
        hasCondition(tokenDocument.actor, ['dead', 'grappled', 'incapacitated', 'paralyzed', 'petrified', 'restrained', 'sleep', 'stunned', 'unconscious'])
      );

      //Creatures can be slowed or hasted to half or double their available movement speeds respectively.
      const movementMultiplier = (((hasCondition(tokenDocument.actor, ['slowed']) || exhaustion >= 2) ? 0.5 : 1) * (hasCondition(tokenDocument.actor, ['hasted']) ? 2 : 1));

      const movementRange = movementRestricted ? 0 : (tokenMovement[movementMode] * movementMultiplier);
      return [{ range: movementRange, color: movementMode }, { range: movementRange * 2, color: 'dash' }];
    }
  }

  // Registers the speed provider to be used by Drag Ruler's API.
  window.dragRuler?.registerModule(/** @type {string} */(MODULE_ID), BlackFlagSpeedProvider);
};


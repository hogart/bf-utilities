/**
 * @param {number} cr
 * @returns {string}
 */
function stringifyCr(cr) {
  if (cr >= 1) {
    return cr.toString();
  } else if (cr === 0.5) {
    return '½';
  } else if (cr === 0.25) {
    return '¼';
  } else if (cr === 0.125) {
    return '⅛';
  } else {
    return '0';
  }
}

export function canvasToXp() {
  if (!game.user?.isGM) {
    return []; // Ensure only GM runs this
  }
  // Get all tokens on the active scene
  const hostileTokens = canvas?.scene?.tokens.contents.filter(token =>
    token.actor && token.disposition === -1, // Hostile disposition
  );

  if (!hostileTokens) {
    return [];
  }

  // Count CRs
  const crs = hostileTokens.reduce((acc, token) => {
    const numberCr = /** @type BlackFlagActor */(token.actor).system.attributes.cr ?? 0; // Default to 0 if missing CR
    const cr = stringifyCr(numberCr);

    if (!acc[cr]) {
      acc[cr] = {cr, count: 0};
    }
    acc[cr].count += 1;

    return acc;
  }, /** @type Record<string, {cr: string, count: number}>*/({}));

  return Object.values(crs);
};
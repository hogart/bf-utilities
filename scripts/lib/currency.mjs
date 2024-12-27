/**
 * @param {number} amount
 * @param {number} divider
 * @returns {[number, number]}
 */
function div(amount, divider) {
  return [Math.floor(amount / divider), amount % divider];
}

/**
 * @param {number} platinum
 * @param {number} gold
 * @param {number} silver
 * @param {number} copper
 * @returns {number} total currency in coppers
 */
export function _totalInCopper(platinum, gold, silver, copper) {
  return (platinum * 1000) + (gold * 100) + (silver * 10) + copper;
}

/**
 * Converts coppers to higher denominations.
 * @param {number} totalCopper
 * @returns {Coinage}
 */
export function _exchangeCoppers(totalCopper) {
  const pp = Math.floor(totalCopper / 1000);
  const gp = Math.floor((totalCopper - (pp * 1000)) / 100);
  const sp = Math.floor((totalCopper - (pp * 1000) - (gp * 100)) / 10);
  const cp = totalCopper - (pp * 1000) - (gp * 100) - (sp * 10);

  return {pp, gp, sp, cp};
}

/**
 * This function divides the given amount of currency between few people, as if they have a free access to different coinages.
 * Few overflow coppers can fall to the first few people.
 *
 * @param {number} platinum
 * @param {number} gold
 * @param {number} silver
 * @param {number} copper
 * @param {number} peopleCount
 * @returns {{pp: number, gp: number, sp: number, cp: number}[]}
 */
export function divideCurencyWithExchange(platinum, gold, silver, copper, peopleCount) {
  const totalCopper = _totalInCopper(platinum, gold, silver, copper);
  const [copperPerPerson, remainder] = div(totalCopper, peopleCount);

  const results = [];

  for (let index = 0; index < peopleCount; index++) {
    let totalCopperToGive = copperPerPerson;

    // Distribute remainder to the first few people
    if (index < remainder) {
      totalCopperToGive += 1;
    }

    results.push(_exchangeCoppers(totalCopperToGive));
  }

  return results;
}

/**
 * This function divides the given amount of currency between few people, trying to distribute each coinage first.
 * The rest will be distributed as if with the access to exchange. This is realistic for reach adventurers who tend to have a lot of coins.
 * This can make a difference if you use coin weight and encumbrance rules.
 *
 * @param {number} platinum
 * @param {number} gold
 * @param {number} silver
 * @param {number} copper
 * @param {number} peopleCount
 * @returns {{pp: number, gp: number, sp: number, cp: number}[]}
 */
export function divideCurrencyInWilderness(platinum, gold, silver, copper, peopleCount) {
  const [pp, overflowPP] = div(platinum, peopleCount);
  const [gp, overflowGP] = div(gold, peopleCount);
  const [sp, overflowSP] = div(silver, peopleCount);
  const [cp, overflowCP] = div(copper, peopleCount);

  const results = divideCurencyWithExchange(overflowPP, overflowGP, overflowSP, overflowCP, peopleCount);

  return results.map(result => {
    return {
      pp: result.pp + pp,
      gp: result.gp + gp,
      sp: result.sp + sp,
      cp: result.cp + cp,
    };
  });
}

/**
 * Exchanges all coinage to highest possible denomination.
 * @param {number} platinum
 * @param {number} gold
 * @param {number} silver
 * @param {number} copper
 * @returns {Coinage}
 */
export function reduceCoins(platinum, gold, silver, copper) {
  const totalCopper = _totalInCopper(platinum, gold, silver, copper);

  return _exchangeCoppers(totalCopper);
}

/**
 * @param {Coinage} coinage
 * @returns {string[]}
 */
export function coinageToStrings(coinage) {
  const nonEmptyDenominations = [];

  if (coinage.pp) {
    nonEmptyDenominations.push(`${coinage.pp} pp`);
  }

  if (coinage.gp) {
    nonEmptyDenominations.push(`${coinage.gp} gp`);
  }

  if (coinage.sp) {
    nonEmptyDenominations.push(`${coinage.sp} sp`);
  }

  if (coinage.cp) {
    nonEmptyDenominations.push(`${coinage.cp} cp`);
  }

  return nonEmptyDenominations;
}

/**
 * @param {string} name
 * @param {Coinage} coinage
 * @returns {string}
 */
export function _actorReceivedCoinageString(name, coinage) {
  const nonEmptyDenominations = coinageToStrings(coinage);

  const amount = nonEmptyDenominations.length > 1
    ? nonEmptyDenominations.slice(0, -1).join(', ') + ' and ' + nonEmptyDenominations.at(-1)
    : nonEmptyDenominations[0];

  return `${name} received ${amount}.`;
}

export class NotEnoughMoneyError extends RangeError {
  /**
   * @param {number} amountInCoppers
   */
  constructor(amountInCoppers) {
    super(`${Math.abs(amountInCoppers)} copper pieces short`);
    this.name = this.constructor.name;
  }
}

/**
 *
 * @param {Coinage} actorCoinage
 * @param {Coinage} toSpend
 * @return {Coinage}
 */
export function spendCoinage(actorCoinage, toSpend) {
  const actorCopper = _totalInCopper(actorCoinage.pp, actorCoinage.gp, actorCoinage.sp, actorCoinage.cp);
  const toSpendCopper = _totalInCopper(toSpend.pp, toSpend.gp, toSpend.sp, toSpend.cp);

  const resultInCopper = actorCopper - toSpendCopper;

  if (resultInCopper < 0) {
    throw new NotEnoughMoneyError(resultInCopper);
  } else {
    return _exchangeCoppers(resultInCopper);
  }
}
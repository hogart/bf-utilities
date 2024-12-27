// TODO: fetch from compendium
export const currencyList = [
  {name: 'platinum', label: 'Platinum (pp):', img: 'icons/commodities/currency/coin-embossed-skull-silver.webp'},
  {name: 'gold', label: 'Gold (gp):', img: 'icons/commodities/currency/coin-inset-insect-gold.webp'},
  {name: 'silver', label: 'Silver (sp):', img: 'icons/commodities/currency/coin-inset-snail-silver.webp'},
  {name: 'copper', label: 'Copper (cp):', img: 'icons/commodities/currency/coin-oval-rune-copper.webp'},
];

/**
 * @param {string} currencyIdentifier
 */
async function getCurrencyItemFromCompendium(currencyIdentifier) {
  const compendium = game.packs?.get('black-flag.currencies');
  if (!compendium) {
    ui.notifications?.error('Currency compendium not found.');
    return null;
  }

  // Load the compendium index (if not already loaded)
  if (!compendium.index.size) {
    await compendium.getIndex();
  }

  // Find the item by name
  // @ts-expect-error BlackFlag typings are incomplete
  const itemEntry = compendium.index.find(i => i.system.identifier.value === currencyIdentifier);
  if (!itemEntry) {
    ui.notifications?.error(`Currency '${currencyIdentifier}' not found in the compendium.`);
    return null;
  }

  // Get the full item data
  return await compendium.getDocument(itemEntry._id);
}

/**
 * Gets or creates and returns a currency item
 * @param {BlackFlagActor} actor
 * @param {string} currencyIdentifier
 * @returns {Promise<BlackFlagItem|undefined>}
 */
async function getActorCurrency(actor, currencyIdentifier) {
  const actorItems = actor.items;

  let currencyItem = actorItems.find((item) => {
    // @ts-expect-error BlackFlag typings are incomplete
    return item.type === 'currency' && item.system.identifier.value === currencyIdentifier;
  });

  if (!currencyItem) {
    const currencyCompendiumItem = await getCurrencyItemFromCompendium(currencyIdentifier);

    if (currencyCompendiumItem) {
      const inserted = /** @type BlackFlagItem[]|undefined */(await actor.createEmbeddedDocuments('Item', [currencyCompendiumItem.toObject()]));
      currencyItem = inserted?.[0];
    }
  }

  return currencyItem;
}

/**
 * @param {BlackFlagActor} actor
 * @param {string} currencyIdentifier
 * @param {number} quantity
 * @param {'update'|'set'} mode
 */
export async function upsertActorCurrency(actor, currencyIdentifier, quantity, mode = 'update') {
  const currencyItem = await getActorCurrency(actor, currencyIdentifier);
  const newValue = mode === 'update' ? (currencyItem?.system.quantity || 0) + quantity : quantity;

  // @ts-expect-error BlackFlag typings are incomplete
  return await currencyItem?.update({ 'system.quantity': newValue });
}

/**
 * @param {BlackFlagActor} actor
 * @param {Coinage} coinage
 * @param {'update'|'set'} mode
 */
export async function upsertActorCoinage(actor, coinage, mode = 'update') {
  for (let [key, quantity] of Object.entries(coinage)) {
    await upsertActorCurrency(actor, key, quantity, mode);
  }
}

/**
 *
 * @param {BlackFlagActor} actor
 * @return {Promise<Coinage>}
 */
export async function getActorCoinage(actor) {
  return {
    pp: (await getActorCurrency(actor, 'pp'))?.system.quantity || 0,
    gp: (await getActorCurrency(actor, 'gp'))?.system.quantity || 0,
    sp: (await getActorCurrency(actor, 'sp'))?.system.quantity || 0,
    cp: (await getActorCurrency(actor, 'cp'))?.system.quantity || 0,
  };
}
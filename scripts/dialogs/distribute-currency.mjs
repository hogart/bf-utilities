import { _actorReceivedCoinageString, divideCurencyWithExchange, divideCurrencyInWilderness } from '../lib/currency.mjs';
import { notifyActorOwner } from '../lib/utils.mjs';
import { getPath, registerPartial, render } from '../lib/tpl.mjs';
import { getPcActors, getSelectedActors } from '../lib/actor.mjs';
import { currencyList, upsertActorCoinage } from '../lib/actor-currency.mjs';

export async function distributeCurrency(actors = getPcActors()) {
  await registerPartial('actor-checkbox');
  await registerPartial('currency-input');
  loadTemplates([
    getPath('distribute-currency'),
  ]);

  return new Dialog({
    'title': 'Distribute Currency',
    'content': await render('distribute-currency', {actors, currencies: currencyList}),
    'buttons': {
      distribute: {
        label: 'Distribute',
        callback(html) {
          const $html = /** @type {JQuery} */ (html);
          const form = $html[0]; // de-jqueryify!

          const pp = /** @type {HTMLInputElement} */ (form.querySelector('[name="platinum"]')).valueAsNumber;
          const gp = /** @type {HTMLInputElement} */ (form.querySelector('[name="gold"]')).valueAsNumber;
          const sp = /** @type {HTMLInputElement} */ (form.querySelector('[name="silver"]')).valueAsNumber;
          const cp = /** @type {HTMLInputElement} */ (form.querySelector('[name="copper"]')).valueAsNumber;
          const method = /** @type {HTMLInputElement} */ (form.querySelector('[name="method"]:checked')).value;

          assignCurrency(
            {pp, gp, sp, cp},
            getSelectedActors(actors, form),
            /** @type {'exchange' | 'wilderness'} */(method),
          );
        },
      },
      cancel: {
        label: 'Cancel',
      },
    },
    'default': 'distribute',
  }).render(true);
}

/**
 * @param {Coinage} coinage
 * @param {BlackFlagActor[]} selectedActors
 * @param {'exchange' | 'wilderness'} method
 */
async function assignCurrency(coinage, selectedActors, method) {
  let op = divideCurencyWithExchange;
  if (method === 'wilderness') {
    op = divideCurrencyInWilderness;
  }

  const bags = op(coinage.pp, coinage.gp, coinage.sp, coinage.cp, selectedActors.length);

  // Loop over selected actors and distribute the currency
  for (let [index, actor] of selectedActors.entries()) {
    await upsertActorCoinage(actor, bags[index], 'update');

    notifyActorOwner(actor, _actorReceivedCoinageString(actor.name, coinage));
  }
}
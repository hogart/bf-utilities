import { _actorReceivedCoinageString, divideCurencyWithExchange, divideCurrencyInWilderness } from '../lib/currency.mjs';
import { notifyActorOwner } from '../lib/utils.mjs';
import { getPcActors, getSelectedActors } from '../lib/actor.mjs';
import { upsertActorCoinage } from '../lib/actor-currency.mjs';
import { escapeHtml } from '../lib/tpl.mjs';
import { DistributeCurrencyElement } from '../components/distribute-currency.mjs';

export async function distributeCurrency(actors = getPcActors(true)) {
  DistributeCurrencyElement.register();

  const actorsAttr = escapeHtml(JSON.stringify(actors.map(({id, name, img}) => ({id, name, img}))));

  const content = document.createElement('div');
  content.innerHTML = `<bfu-distribute-currency actors="${actorsAttr}"></bfu-distribute-currency>`;

  return new foundry.applications.api.DialogV2({
    window: {title: 'Distribute Currency'},
    content,
    buttons: [
      {
        'action': 'distribute',
        'label': 'Distribute',
        'default': true,
        callback(_event, button) {
          const form = button.form;
          if (!form) {
            return;
          }

          const pp = /** @type {HTMLInputElement} */ (form.querySelector('input[name="platinum"]')).valueAsNumber;
          const gp = /** @type {HTMLInputElement} */ (form.querySelector('input[name="gold"]')).valueAsNumber;
          const sp = /** @type {HTMLInputElement} */ (form.querySelector('input[name="silver"]')).valueAsNumber;
          const cp = /** @type {HTMLInputElement} */ (form.querySelector('input[name="copper"]')).valueAsNumber;
          const method = /** @type {HTMLInputElement} */ (form.querySelector('[name="method"]:checked')).value;

          assignCurrency(
            {pp, gp, sp, cp},
            getSelectedActors(actors, form),
            /** @type {'exchange' | 'wilderness'} */(method),
          );
        },
      },
      {
        action: 'cancel',
        label: 'Cancel',
      },
    ],
  }).render({force: true});
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
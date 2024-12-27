import { notifyActorOwner } from '../lib/utils.mjs';
import { getPath, registerPartial, render } from '../lib/tpl.mjs';
import { getPcActors, getSelectedActors } from '../lib/actor.mjs';

const xpTable = [
  { cr: '0', xp: 10 },
  { cr: '⅛', xp: 25 },
  { cr: '¼', xp: 50 },
  { cr: '½', xp: 100 },
  { cr: '1', xp: 200 },
  { cr: '2', xp: 450 },
  { cr: '3', xp: 700 },
  { cr: '4', xp: 1100 },
  { cr: '5', xp: 1800 },
  { cr: '6', xp: 2300 },
  { cr: '7', xp: 2900 },
  { cr: '8', xp: 3900 },
  { cr: '9', xp: 5000 },
  { cr: '10', xp: 5900 },
  { cr: '11', xp: 7200 },
  { cr: '12', xp: 8400 },
  { cr: '13', xp: 10000 },
  { cr: '14', xp: 11500 },
  { cr: '15', xp: 13000 },
  { cr: '16', xp: 15000 },
  { cr: '17', xp: 18000 },
  { cr: '18', xp: 20000 },
  { cr: '19', xp: 22000 },
  { cr: '20', xp: 25000 },
  { cr: '21', xp: 33000 },
  { cr: '22', xp: 41000 },
  { cr: '23', xp: 50000 },
  { cr: '24', xp: 62000 },
  { cr: '25', xp: 75000 },
  { cr: '26', xp: 90000 },
  { cr: '27', xp: 105000 },
  { cr: '28', xp: 120000 },
  { cr: '29', xp: 135000 },
  { cr: '30', xp: 155000 },
];

export async function grantXp(actors = getPcActors()) {
  await registerPartial('actor-checkbox');
  await registerPartial('cr-entry');
  loadTemplates([
    getPath('grant-xp'),
  ]);

  const content = await render('grant-xp', {actors, xpTable});

  return new Dialog({
    'title': 'Grant XP',
    'content': content,
    'buttons': {
      grant: {
        label: 'Grant XP',
        callback: (html) => {
          const $html = /** @type {JQuery} */ (html);

          const form = $html[0]; // de-jqueryify!
          const selectedActors = getSelectedActors(actors, form);

          const plainXp = /** @type {HTMLInputElement} */ (form.querySelector('[name="plainXp"]')).valueAsNumber || 0;
          let totalEncounterXP = 0;
          form.querySelectorAll('.creature-group').forEach((element) => {
            const xp = /** @type {HTMLSelectElement} */ (element.querySelector('select[name="cr"]'))?.value ?? 0;
            const quantity = /** @type {HTMLInputElement} */ (element.querySelector('input[name="quantity"]')).valueAsNumber || 0;
            totalEncounterXP += parseInt(xp) * quantity;
          });

          // Final XP to distribute
          const totalXP = plainXp + totalEncounterXP;
          const xpPerActor = Math.floor(totalXP / selectedActors.length);

          const source = /** @type {HTMLInputElement} */ (form.querySelector('[name="source"]')).value || '';

          assignXp(xpPerActor, selectedActors, source);
        },
      },
      cancel: {
        label: 'Cancel',
      },
    },
    'default': 'grant',
    render(html) {
      const $html = /** @type {JQuery} */ (html);

      $html.on('click', '.add-creature-btn', async () => {
        $html.find('#creature-section').append(await render('cr-entry', {xpTable}));
      });
      $html.on('click', '.remove-creature-btn', (event) => {
        $(event.currentTarget).closest('.creature-group').remove();
      });
    },
  }).render(true);
}

/**
 * @param {number} xp
 * @param {Actor[]} selectedActors
 * @param {string} source
 */
async function assignXp(xp, selectedActors, source = 'Grant XP Macro') {
  // Loop over selected actors and grant the XP
  for (let actor of selectedActors) {
    // Get the current XP and log
    // @ts-expect-error BlackFlag typings are incomplete
    let currentXP = actor.system.progression.xp.value || 0;
    // @ts-expect-error BlackFlag typings are incomplete
    let xpLog = actor.system.progression.xp.log || [];

    // Calculate the new total XP
    let newXP = currentXP + xp;

    // Create the log entry for this XP grant
    const logEntry = {
      amount: xp,
      source,
      time: {
        local: Date.now(),
        world: 0,
      },
    };

    // Update the actor's XP and log
    await actor.update({
      // @ts-expect-error BlackFlag typings are incomplete
      'system.progression.xp.value': newXP,
      'system.progression.xp.log': [...xpLog, logEntry],
    });

    notifyActorOwner(actor, `${actor.name} has been granted ${xp} XP. New total: ${newXP}`);
  }
}
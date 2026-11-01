import { notifyActorOwner } from '../lib/utils.mjs';
import { getPcActors, getSelectedActors } from '../lib/actor.mjs';
import { canvasToXp } from '../lib/canvas-to-xp.mjs';
import { escapeHtml } from '../lib/tpl.mjs';
import { GrantXpElement } from '../components/grant-xp.mjs';

/**
 *
 * @param {BlackFlagActor[]} actors
 * @param {{cr: string, count: number}[]} battleFieldXp
 * @returns {Promise<foundry.applications.api.DialogV2>}
 */
export async function grantXp(actors = getPcActors(true), battleFieldXp = []) {
  GrantXpElement.register();

  const actorsAttr = escapeHtml(JSON.stringify(actors.map(({id, name, img}) => ({id, name, img}))));
  const xpAttr = escapeHtml(JSON.stringify(battleFieldXp));

  const content = document.createElement('div');
  content.innerHTML = `<bfu-grant-xp actors="${actorsAttr}" battlefield-xp="${xpAttr}"></bfu-grant-xp>`;

  return new foundry.applications.api.DialogV2({
    window: {title: 'Grant XP'},
    content,
    buttons: [
      {
        'action': 'grant',
        'label': 'Grant XP',
        'default': true,
        'callback': (_event, button) => {
          const form = button.form;
          if (!form) {
            return;
          }
          const selectedActors = getSelectedActors(actors, form);

          const plainXp = /** @type {HTMLInputElement} */ (form.querySelector('[name="plainXp"]')).valueAsNumber || 0;
          let totalEncounterXP = 0;
          form.querySelectorAll('bfu-cr-entry').forEach((element) => {
            totalEncounterXP += /** @type {import('../components/cr-entry.mjs').CrEntryElement} */(element).value;
          });

          // Final XP to distribute
          const totalXP = plainXp + totalEncounterXP;
          const xpPerActor = Math.floor(totalXP / selectedActors.length);

          const source = /** @type {HTMLInputElement} */ (form.querySelector('[name="source"]')).value || '';

          assignXp(xpPerActor, selectedActors, source);
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

export async function grantXpAfterBattle() {
  let actors = getPcActors(true);
  if (!actors.length) {
    ui.notifications?.warn('No PC tokens on the scene, using all available actors');
    actors = getPcActors();
  }

  const xp = canvasToXp();
  grantXp(actors, xp);
}

import { notifyActorOwner } from '../lib/utils.mjs';
import { getPath, render } from '../lib/tpl.mjs';
import { getPcActors, getSelectedActors } from '../lib/actor.mjs';
import { canvasToXp } from '../lib/canvas-to-xp.mjs';
import { ActorSelectorElement } from '../components/actor-selector.mjs';
import { xpTable } from '../lib/cr-table.mjs';
import { CrEntryElement } from '../components/cr-entry.mjs';

/**
 *
 * @param {BlackFlagActor[]} actors
 * @param {{cr: string, count: number}[]} battleFieldXp
 * @returns {Promise<Dialog>}
 */
export async function grantXp(actors = getPcActors(true), battleFieldXp = []) {
  ActorSelectorElement.register();
  CrEntryElement.register();

  loadTemplates([
    getPath('grant-xp'),
  ]);

  const content = await render('grant-xp', {actors, xpTable, battleFieldXp});

  // @ts-expect-error wrong typings?
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
          form.querySelectorAll('bfu-cr-entry').forEach((element) => {
            totalEncounterXP += /** @type {CrEntryElement} */(element).value;
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
        $html.find('#creature-section').append('<bfu-cr-entry cr="" quantity="0"></bfu-cr-entry>');
      });
      $html.on('remove', 'bfu-cr-entry', (event) => {
        $(event.currentTarget).closest('bfu-cr-entry').remove();
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

export async function grantXpAfterBattle() {
  let actors = getPcActors(true);
  if (!actors.length) {
    ui.notifications?.warn('No PC tokens on the scene, using all available actors');
    actors = getPcActors();
  }

  const xp = canvasToXp();
  grantXp(actors, xp);
}
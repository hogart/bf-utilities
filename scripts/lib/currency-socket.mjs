import { MODULE_ID } from './module-id.mjs';
import { getActiveGMs } from './get-active-gms.mjs';
import { getActorCoinage, transferCurrency } from './actor-currency.mjs';
import { NotEnoughMoneyError, spendCoinage } from './currency.mjs';

const SOCKET_EVENT = `module.${MODULE_ID}`;

/**
 * @typedef {{
 *   type: 'transfer-currency',
 *   recipients: string[],
 *   payload: {from: string, to: string, coinage: Coinage},
 * }} TransferCurrencyMessage
 */

/**
 * @param {unknown} coinage
 * @returns {coinage is Coinage}
 */
function isValidCoinage(coinage) {
  if (!coinage || typeof coinage !== 'object') {
    return false;
  }
  const values = ['pp', 'gp', 'sp', 'cp'].map((key) => /** @type {Record<string, unknown>} */(coinage)[key]);
  return values.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

/**
 * @param {string} userId
 * @param {string} message
 */
function notifyUser(userId, message) {
  game.socket?.emit('system.notification', {userId, message, type: 'error'});
}

/**
 * Performed on the active GM's client, since players can't modify actors they don't own.
 * @param {TransferCurrencyMessage['payload']} payload
 * @param {string} requesterId
 */
async function handleTransferRequest(payload, requesterId) {
  const requester = game.users?.get(requesterId);
  const from = /** @type {BlackFlagActor | undefined} */(game.actors?.get(payload?.from));
  const to = /** @type {BlackFlagActor | undefined} */(game.actors?.get(payload?.to));

  if (!requester || !from || !to || from === to || !isValidCoinage(payload.coinage)) {
    notifyUser(requesterId, 'Invalid currency transfer request.');
    return;
  }

  // Only the owner of the source actor may spend its money
  if (!from.testUserPermission(/** @type {User} */(requester), 'OWNER')) {
    notifyUser(requesterId, 'You do not own the character you are transferring from.');
    return;
  }

  try {
    spendCoinage(await getActorCoinage(from), payload.coinage);
  } catch (e) {
    if (e instanceof NotEnoughMoneyError) {
      notifyUser(requesterId, 'You do not have enough money to transfer.');
      return;
    }
    throw e;
  }

  await transferCurrency(from, to, payload.coinage);
}

export function registerCurrencySocket() {
  game.socket?.on(SOCKET_EVENT, (/** @type {TransferCurrencyMessage} */message, /** @type {string} */userId) => {
    if (message?.type !== 'transfer-currency') {
      return;
    }

    // Every client receives the broadcast, only the designated GM acts on it
    if (!game.user?.isGM || !message.recipients?.includes(game.user.id)) {
      return;
    }

    void handleTransferRequest(message.payload, userId);
  });
}

/**
 * @param {BlackFlagActor} from
 * @param {BlackFlagActor} to
 * @param {Coinage} coinage
 * @returns {Promise<boolean>} whether the transfer was performed or successfully requested
 */
export async function requestCurrencyTransfer(from, to, coinage) {
  if (!isValidCoinage(coinage)) {
    ui.notifications?.error('Transfer amounts must be non-negative numbers.');
    return false;
  }

  if (game.user?.isGM) {
    return transferCurrency(from, to, coinage);
  }

  const activeGm = getActiveGMs()[0];
  if (!activeGm) {
    ui.notifications?.error('No active GM is available to transfer currency.');
    return false;
  }

  game.socket?.emit(SOCKET_EVENT, {
    type: 'transfer-currency',
    recipients: [activeGm.id],
    payload: {from: from.id, to: to.id, coinage},
  });

  return true;
}

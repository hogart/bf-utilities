/**
 * @param {string} userId
 * @param {string} message
 */
function _sendNotificationToUser(userId, message) {
  if (game.user?.id === userId) {
    ui.notifications?.info(message);
  } else {
    game.socket?.emit('system.notification', { userId, message });
  }
}

/**
 * @param {Actor} actor
 * @param {string} message
 */
export function notifyActorOwner(actor, message) {
  const owner = game.users?.players.find(user => actor.testUserPermission(user, 'OWNER'));
  if (owner) {
    _sendNotificationToUser(owner.id, message);
  }
}

/**
 * @param {BlackFlagActor} actor
 * @return {boolean}
 */
export function isPc(actor) {
  return actor.type === 'pc';
}
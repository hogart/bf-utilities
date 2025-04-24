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

/**
 * @param {string | Folder} folderOrID
 */
export function getFolderActors(folderOrID) {
  const folder = typeof folderOrID === 'string' ? game.folders?.get(folderOrID) : folderOrID;

  if (!folder) {
    return {
      actors: [],
      partyData: undefined,
    };
  }

  const contents = /** @type BlackFlagActor[] */(folder.contents);
  const actors = contents.filter(isPc);
  const partyData = contents.find(a => a.name === '_partyData');

  return {
    actors,
    partyData,
  };
}
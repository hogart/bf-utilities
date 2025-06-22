export function getActiveGMs() {
  return game.users?.filter(user => user.active && user.isGM) || [];
}
/**
 * @fileoverview Action which handles turn notifications from Civ 6. Messages
 * from Civ 6 are always of the form:
 *
 * { value1: "Game Name", value2: 'Player Name', value3: 'Round Number'}
 */

import { postMessage } from "../utils.js";
import { getChannelByRozeId, getDiscordId } from "../db.js";

async function civTurnNotificationAction(request, response) {
  const rozeId = request.url.substr(3);
  const channel = await getChannelByRozeId(rozeId);
  if (channel === null) {
    console.error(`Unregistered roze id: ${rozeId}`);
    return response.send("");
  }

  const gameName = request.body.value1;
  const steamUser = request.body.value2;
  const discordId = await getDiscordId(channel.channelId, steamUser);

  const userStr = discordId ? `<@${discordId}>` : steamUser;
  const gamePrefix = `${gameName}: `;
  const message = getRandomTurnNotification(userStr);
  postMessage(channel.channelId, gamePrefix + message);
  return response.send("");
}

function getRandomTurnNotification(user) {
  const index = Math.floor(Math.random() * 17); // Random # from 0 to 16.
  switch (index) {
    case 0:
      return `${user} it's your turn`;
    case 1:
      return `you're up ${user}`;
    case 2:
      return `go ahead ${user}`;
    case 3:
      return `have a go ${user}`;
    case 4:
      return `${user}, time to take your turn`;
    case 5:
      return `uh oh, looks like it's time for ${user}`;
    case 6:
      return `${user}, friendly ping`;
    case 7:
      return `${user}, go go go`;
    case 8:
      return `has anyone seen ${user}? their turn to play.`;
    case 9:
      return `good luck ${user}, it's your move`;
    case 10:
      return `take it away, ${user}`;
    case 11:
      return `tick tock it's ${user} o'clock`;
    case 12:
      return `brace yourselves, it's time for ${user}`;
    case 13:
      return `time to shine, ${user}!`;
    case 14:
      return `attention ${user}, it is your turn. I repeat, it is your turn.`;
    case 15:
      return `it's go time, ${user}`;
    case 16:
      return `no pressure, ${user}, but you're up`;
  }
  return "something went wrong, but anyways, it's ${user}'s turn.";
}

export { civTurnNotificationAction };

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
  const message = getRandomTurnNotifcation(gameName, userStr);
  postMessage(channel.channelId, message);
  return response.send("");
}

function getRandomTurnNotifcation(game, user) {
  const index = Math.floor(Math.random() * 17); // Random # from 0 to 16.
  switch (index) {
    case 0:
      return `${game} : ${user} it's your turn`;
    case 1:
      return `${game} : you're up ${user}`;
    case 2:
      return `${game} : go ahead ${user}`;
    case 3:
      return `${game} : have a go ${user}`;
    case 4:
      return `${game} : ${user}, time to take your turn`;
    case 5:
      return `${game} : uh oh, looks like it's time for ${user}`;
    case 6:
      return `${game} : ${user}, friendly ping`;
    case 7:
      return `${game} : ${user}, go go go`;
    case 8:
      return `${game} : has anyone seen ${user}? their turn to play.`;
    case 9:
      return `${game} : good luck ${user}, it's your move`;
    case 10:
      return `${game} : take it away, ${user}`;
    case 11:
      return `${game} : tick tock it's ${user} o'clock`;
    case 12:
      return `${game} : brace yourselves, it's time for ${user}`;
    case 13:
      return `${game} : time to shine, ${user}!`;
    case 14:
      return `${game} : attention ${user}, it is your turn. I repeat, it is your turn.`;
    case 15:
      return `${game} : it's go time, ${user}`;
    case 16:
      return `${game} : no pressure, ${user}, but you're up`;
  }
  return "${game} : something went wrong, but anyways, it's ${user}'s turn.";
}

export { civTurnNotificationAction };

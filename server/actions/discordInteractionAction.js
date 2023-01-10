/**
 * @fileoverview Action which handles the messages from discord via the
 * application's configured "Interactions Endpoint URL".
 */

import { InteractionType, InteractionResponseType } from "discord-interactions";

import { civCommandOptions } from "../commands/civCommand.js";
import { addChannel, addUser, getDiscordId, updateUser } from "../db.js";

async function discordInteractionAction(request, response) {
  if (request.body.type === InteractionType.PING) {
    return response.send({ type: InteractionResponseType.PONG });
  } else if (request.body.type === InteractionType.APPLICATION_COMMAND) {
    return await handleApplicationCommands(request, response);
  }
  return response.status(400).send("Bad data");
}

async function handleApplicationCommands(request, response) {
  const data = request.body.data;
  if (data.name !== "civ") {
    return loggedError(response, `Unrecognized command: ${data.name}`);
  } else if (data.options === undefined || data.options.length === 0) {
    return loggedError(response, `Command ${data.name} is missing options`);
  }

  const option = data.options[0].name;
  switch (option) {
    case civCommandOptions.START:
      return await handleStartCommand(request, response);
    case civCommandOptions.IAM:
      return await handleIAmCommand(request, response);
    default:
      return loggedError(response, `Unrecognized option: ${option}`);
  }
}

async function handleStartCommand(request, response) {
  const channel = await addChannel(request.body.channel_id);
  if (channel === null) {
    return loggedError(response, "Error starting. Please try again.");
  }

  const url = `http://roze.run/_/${channel.rozeId}`;
  const message = `I've registered your channel. You can use ${url} for the webhook in Civ and updates will show up here. Players can use \`/civ iam\` to map their steam handles to their discord names.`;
  return sendInteractionResponse(response, message);
}

async function handleIAmCommand(request, response) {
  const channelId = request.body.channel_id;
  const discordId = request.body.member.user.id;
  const steamName = request.body.data.options[0].options[0].value;

  let message;
  const oldId = await getDiscordId(channelId, steamName);
  if (oldId && oldId === discordId) {
    message = `You are already ${steamName}, <@${oldId}>.`;
  } else if (oldId) {
    message = `Updating ${steamName}. Was <@${oldId}>. Now <@${discordId}>.`;
    await updateUser(channelId, steamName, discordId);
  } else {
    message = `Got it. ${steamName} is <@${discordId}>.`;
    await addUser(channelId, steamName, discordId);
  }

  return sendInteractionResponse(response, message);
}

function sendInteractionResponse(response, message) {
  return response.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: message },
  });
}

function loggedError(response, message) {
  console.error(message);
  return sendInteractionResponse(response, message);
}

export { discordInteractionAction };

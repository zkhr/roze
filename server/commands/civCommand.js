import "dotenv/config";

import { DiscordRequest } from "../utils.js";

const APP_ID = process.env.APP_ID;

const civCommandOptions = {
  START: "start",
  IAM: "iam",
};

async function createCivCommand() {
  console.log("Registering /civ command.");

  const endpoint = `applications/${APP_ID}/commands`;
  const body = {
    name: "civ",
    description: "Update @roze's civ game information.",
    options: [
      {
        name: civCommandOptions.START,
        description: "Provides instructions for registering a new channel.",
        type: 1,
      },
      {
        name: civCommandOptions.IAM,
        description:
          "Maps a steam username (or civ player name) to your discord handle.",
        type: 1,
        options: [
          {
            name: "steam",
            description: "The steam username to use.",
            type: 3,
            required: true,
          },
        ],
      },
    ],
  };

  try {
    await DiscordRequest(endpoint, { method: "POST", body });
  } catch (err) {
    console.error("Error installing commands: ", err);
  }
}

export { createCivCommand, civCommandOptions };

import "dotenv/config";
import fetch from "node-fetch";
import { verifyKey } from "discord-interactions";
import { InteractionResponseType } from "discord-interactions";

function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf, encoding) {
    if (req.url !== "/discord") {
      return;
    }

    const signature = req.get("X-Signature-Ed25519");
    const timestamp = req.get("X-Signature-Timestamp");

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send("Bad request signature");
      throw new Error("Bad request signature");
    }
  };
}

async function DiscordRequest(endpoint, options) {
  const url = "https://discord.com/api/v10/" + endpoint;
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent": "DiscordBot (https://github.com/zkhr/roze-run, 1.0.0)",
    },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  return res;
}

async function postMessage(channelId, content) {
  try {
    await DiscordRequest(`/channels/${channelId}/messages`, {
      method: "POST",
      body: { content },
    });
  } catch (err) {
    console.error(err);
  }
}

export { VerifyDiscordRequest, DiscordRequest, postMessage };

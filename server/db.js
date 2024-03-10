import "dotenv/config";
import pg from "pg";

import crypto from "crypto";

const { Pool } = pg;

/**
 * A pool (https://node-postgres.com/api/pool) which can be used to
 * generate clients to talk to the Postgres DB with some default configs.
 */
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/** Adds a mapping from steam username to discord id for the user. */
async function addUser(channelId, steamName, discordId) {
  const db = await pool.connect();

  try {
    await db.query(
      "INSERT INTO Users(channel_id, steam_name, discord_id) VALUES ($1, $2, $3)",
      [channelId, steamName, discordId]
    );
  } catch (e) {
    console.log(e);
  } finally {
    db.release();
  }
}

/** Updates a mapping from steam username to discord id for the user. */
async function updateUser(channelId, steamName, discordId) {
  const db = await pool.connect();

  try {
    await db.query(
      "UPDATE Users SET discord_id=$1 WHERE channel_id=$2 AND steam_name=$3",
      [discordId, channelId, steamName]
    );
  } catch (e) {
    console.log(e);
  } finally {
    db.release();
  }
}

/** Returns the user id if present, or null if not found. */
async function getDiscordId(channelId, steamName) {
  const db = await pool.connect();

  const response = await db.query(
    "SELECT discord_id FROM Users WHERE channel_id=$1 AND steam_name=$2",
    [channelId, steamName]
  );
  db.release();
  if (!response.rows.length) {
    return null;
  }

  return response.rows[0].discord_id;
}

/** Adds a new channel. Returns the roze id for that channel. */
async function addChannel(guildId, channelId) {
  const existingChannel = await getChannelByChannelId(channelId);
  if (existingChannel) {
    return existingChannel;
  }

  const db = await pool.connect();
  const rozeId = genRozeId();
  try {
    await db.query(
      "INSERT INTO Channels(channel_id, guild_id, roze_id) VALUES ($1, $2, $3)",
      [channelId, guildId, rozeId]
    );
    return { channelId, rozeId };
  } catch (e) {
    console.log(e);
  } finally {
    db.release();
  }

  return null;
}

/** Returns the channel id if present by the channel id, or null if not found. */
async function getChannelByChannelId(channelId) {
  const db = await pool.connect();

  const response = await db.query(
    "SELECT channel_id, roze_id FROM Channels WHERE channel_id=$1",
    [channelId]
  );
  db.release();
  if (!response.rows.length) {
    return null;
  }

  const entry = response.rows[0];
  return {
    channelId: entry.channel_id,
    rozeId: entry.roze_id,
  };
}

/** Returns the channel id if present by the roze id, or null if not found. */
async function getChannelByRozeId(rozeId) {
  const db = await pool.connect();

  const response = await db.query(
    "SELECT channel_id, roze_id FROM Channels WHERE roze_id=$1",
    [rozeId]
  );
  db.release();
  if (!response.rows.length) {
    return null;
  }

  const entry = response.rows[0];
  return {
    channelId: entry.channel_id,
    rozeId: entry.roze_id,
  };
}

function genRozeId(length) {
  return crypto.randomBytes(2).toString("hex");
}

export {
  addUser,
  updateUser,
  getDiscordId,
  addChannel,
  getChannelByChannelId,
  getChannelByRozeId,
};

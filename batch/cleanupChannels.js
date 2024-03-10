/**
 * This script deletes *all* data about servers that have removed @roze. This
 * includes Channel information (mapping channels to their webhook urls) and
 * any usernames that have been aliased in the Users table.
 */

import "dotenv/config";
import fetch from "node-fetch";
import { program } from "commander";
import pg from "pg";

const { Pool } = pg;

program.option("--no-dry-run", "Whether to update the db.").parse();

const IS_DRY_RUN = program.opts().dryRun;

printHeader();

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
const db = await connectToDb();

const discordGuildIds = await fetchGuildIdsFromDiscord();
const dbGuildIds = await fetchGuildIdsFromDb();
const invalidGuildIds = determineInvalidGuildIds(discordGuildIds, dbGuildIds);
await deleteInvalidGuilds(invalidGuildIds);
await commitChanges();

function printHeader() {
  const message = IS_DRY_RUN
    ? "DRY RUN of the @roze channel cleanup batch job."
    : "@roze channel cleanup batch job. NOT A DRY RUN.";
  console.log("┌───────────────────────────────────────────────┐");
  console.log(`│${message}│`);
  console.log("└───────────────────────────────────────────────┘");
}

async function connectToDb() {
  console.log("Connecting to db.");
  const db = await pool.connect();
  await db.query("BEGIN"); // Start a transaction
  return db;
}

async function fetchGuildIdsFromDiscord() {
  console.log("Fetching guilds from discord.");
  const url = "https://discord.com/api/v10/users/@me/guilds";
  const response = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
  });
  const guilds = await response.json();
  console.log(`Found ${guilds.length} guilds.`);
  return guilds.map((guild) => guild.id);
}

async function fetchGuildIdsFromDb() {
  console.log("Fetching guilds from the db.");
  const result = await db.query(
    "SELECT DISTINCT guild_id FROM Channels WHERE guild_id IS NOT NULL"
  );
  console.log(`Found ${result.rows.length} guilds.`);
  return result.rows.map((row) => row.guild_id);
}

function determineInvalidGuildIds(discordGuildIds, dbGuildIds) {
  const invalidIds = dbGuildIds.filter((id) => !discordGuildIds.includes(id));
  console.log(`Found ${invalidIds.length} invalid ids: [${invalidIds}]`);
  return invalidIds;
}

async function deleteInvalidGuilds(guildIds) {
  for (const id of guildIds) {
    console.log(`Deleting channels and users for guild [${id}]`);

    const userResult = await db.query(
      "DELETE FROM Users u USING Channels c WHERE c.guild_id=$1 AND u.channel_id = c.channel_id",
      [id]
    );
    console.log(`-> Deleted ${userResult.rowCount} users.`);

    const channelResult = await db.query(
      "DELETE FROM Channels WHERE guild_id=$1",
      [id]
    );
    console.log(`-> Deleted ${channelResult.rowCount} channels.`);
  }
}

async function commitChanges() {
  if (IS_DRY_RUN) {
    console.log(
      `\nThis is a dry run! Aborting transaction. Run with the --no-dry-run flag to commit these changes.`
    );
    await db.query("ABORT"); // Abort the transaction
  } else {
    await db.query("COMMIT"); // End the transaction
  }
  db.release();
  await pool.end();
}

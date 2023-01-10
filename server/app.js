import "dotenv/config";
import express from "express";

import { createCivCommand } from "./commands/civCommand.js";
import { router } from "./router.js";
import { VerifyDiscordRequest } from "./utils.js";

const app = express();
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

app.use("/", router);

const PORT = process.env.PORT;

app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);
  await createCivCommand();
});

/**
 * @fileoverview The mappings from paths to the action that produces a result
 * for that path.
 */

import express from "express";
import { civTurnNotificationAction } from "./actions/civTurnNotificationAction.js";
import { discordInteractionAction } from "./actions/discordInteractionAction.js";

const router = express.Router();

router.post(/\/_\/\w{4}$/, civTurnNotificationAction);
router.post("/discord", discordInteractionAction);

export { router };

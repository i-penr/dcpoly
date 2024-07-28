import { Events } from "discord.js";
import Event from "../models/classes/Event";
import { Player } from "../db/Player";

const event = new Event(Events.ClientReady, true, (client) => {
    Player.sync();
    console.log(`Connected. Logged in as ${client.user!.tag}`);
});

export { event };
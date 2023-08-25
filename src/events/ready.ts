import { Events } from "discord.js";
import Event from "../models/classes/Event";

const event = new Event(Events.ClientReady, true, (client) => {
    console.log(`Connected. Logged in as ${client.user!.tag}`);
});

export { event };
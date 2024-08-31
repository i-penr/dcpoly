import { Events } from "discord.js";
import Event from "../models/classes/Event";
import { setupDatabase } from "../db/db_creation/db_creation";

const event = new Event(Events.ClientReady, true, async (client) => {
    try {
        await setupDatabase();
        console.log(`Connected. Logged in as ${client.user!.tag}`);
    } catch (err: any) {
        console.error('There was an error with the ClientReady event: ', { err });
    }
});


export { event };
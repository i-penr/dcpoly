import { Collection, Client as DiscordClient, GatewayIntentBits } from "discord.js";
import Command from "../interfaces/Command";

export default class Client extends DiscordClient {
    commands: Collection<string, Command>;

    constructor() {
        super({ intents: [GatewayIntentBits.Guilds] });
        this.commands = new Collection();
    }
}
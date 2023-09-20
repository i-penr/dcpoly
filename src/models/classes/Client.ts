import { Collection, Client as DiscordClient, GatewayIntentBits } from "discord.js";
import Command from "../interfaces/Command";

export default class Client extends DiscordClient {
    private static client = new Client();
    commands: Collection<string, Command>;

    private constructor() {
        super({ intents: [GatewayIntentBits.Guilds] });
        this.commands = new Collection();
    }

    public static getInstance(): Client {
        return this.client;
    }

    
}
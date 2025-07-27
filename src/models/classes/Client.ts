import { Collection, Client as DiscordClient, GatewayIntentBits } from 'discord.js';
import type Command from '../interfaces/Command';

export default class Client extends DiscordClient {
	private static client: Client | null = null;
	commands: Collection<string, Command>;

	private constructor() {
		super({ intents: [GatewayIntentBits.Guilds] });
		this.commands = new Collection();
	}

	public static getInstance(): Client {
		if (!this.client) {
			this.client = new Client();
			this.client.login(process.env.TOKEN);
		}
		return this.client;
	}
}

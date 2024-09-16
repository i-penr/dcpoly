import { Collection } from "discord.js";
import fs from 'fs';
import path from 'path';
import Client from "./models/classes/Client";
import Command from "./models/interfaces/Command";

const client = Client.getInstance();

// Event handler
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath);

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const { event } = require(filePath);

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Command handler
client.commands = new Collection<string, Command>();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath);

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const { command } = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(command)
            console.log(`[WARNING] The command '${file}' is not well formed.`);
        }
    }
}

client.login(process.env.TOKEN);

export { client };
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath);
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const { command } = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command '${file}' is not well formed.`);
		}
	}
}

const rest = new REST().setToken(process.env.TOKEN!);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

        let data: any;
        const guildId = process.env.SLASH_CMD_DEPLOY_GUILD_ID;

        if (guildId) {
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
                { body: commands },
            );
            console.log(`GUILD ID: ${guildId}`)
        } else {
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: commands },
            );
        }

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();

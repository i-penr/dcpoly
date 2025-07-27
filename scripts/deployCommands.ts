import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

const commands: string[] = [];
const foldersPath = path.join(__dirname, '..', 'src', 'commands');
const commandFolders = fs.readdirSync(foldersPath);

async function loadCommands() {
    const importPromises: Promise<void>[] = [];

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath);

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);

            const importPromise = import(filePath).then(({ command }) => {
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                } else {
                    console.log(`[WARNING] The command '${file}' is not well-formed.`);
                }
            }).catch((err) => {
                console.error(`[ERROR] Failed to load command file: ${filePath}`, err);
            });

            importPromises.push(importPromise);
        }
    }

    await Promise.all(importPromises);
}

const rest = new REST().setToken(process.env.TOKEN!);

(async () => {
    await loadCommands();

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        let data: unknown;
        const guildId = process.env.SLASH_CMD_DEPLOY_GUILD_ID;

        if (guildId) {
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
                { body: commands },
            );
            console.log(`GUILD ID: ${guildId}`);
        } else {
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: commands },
            );
        }

        console.log(`Successfully reloaded ${(data as unknown[]).length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

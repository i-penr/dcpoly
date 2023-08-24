import { BaseInteraction, Collection, Events, GatewayIntentBits } from "discord.js";
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import Client from "./models/classes/Client";
import Command from "./models/interfaces/Command";

const client = new Client();

client.once(Events.ClientReady, (c: any) => {
    console.log(`Connected. Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction: BaseInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    const executedCommand: Command | undefined = (interaction.client as Client).commands!.get(interaction.commandName);

    if (!executedCommand) {
        console.error(`[ERROR] Command '${interaction.commandName}' does not exist.`);
        return;
    }

    try {
        await executedCommand.execute(interaction);
    } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command', ephemeral: true })
        }
    }

});

// Command handler
client.commands = new Collection<string, Command>();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath).default;

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command '${file}' is not well formed.`);
        }
    }
}

client.login(process.env.TOKEN);
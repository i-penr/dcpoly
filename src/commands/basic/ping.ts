import { CommandInteraction, SlashCommandBuilder} from "discord.js";
import Command from '../../models/interfaces/Command';

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Shows bot\'s latency in milliseconds'),
    async execute(interaction: CommandInteraction) {
        await interaction.reply(`Pong!\nLatency: ${Date.now() - interaction.createdTimestamp} ms`);
    },
}

export  { command };
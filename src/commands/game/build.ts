import { CommandInteraction, SlashCommandBuilder} from "discord.js";
import Command from '../../models/interfaces/Command';

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('build')
            .setDescription('Build a house or hotel in one of your properties'),
    async execute(interaction: CommandInteraction) {
        
    },
}

export  { command };
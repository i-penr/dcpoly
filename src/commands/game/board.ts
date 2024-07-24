import { AttachmentBuilder, CommandInteraction, EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import Command from '../../models/interfaces/Command';
import path from 'node:path';
import { buildBoardEmbed } from '../../utils/buildBoardEmbed';
import { drawBoard } from '../../utils/drawBoard';

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('board')
            .setDescription('Shows the board.'),
    async execute(interaction: CommandInteraction) {
        const boardImg = await drawBoard(interaction);
        const boardEmbed = buildBoardEmbed(interaction)
            .setThumbnail(interaction.guild?.iconURL()!)
            .setTitle(`${interaction.guild?.name}'s board`)
            .setDescription('desc.');
        
        interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
    },
}

export  { command };
import { CommandInteraction, SlashCommandBuilder} from 'discord.js';
import Command from '../../models/interfaces/Command';
import { buildBoardEmbed } from '../../utils/buildBoardEmbed';
import { drawBoard } from '../../utils/drawBoard';
import { getCurrentActiveGame } from '../../utils/database';

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('board')
            .setDescription('Shows the board of the current active game on the server.'),
    async execute(interaction: CommandInteraction) {
        const game = await getCurrentActiveGame(interaction.guildId!);

        if (!game) {
            interaction.reply('There are no current active games on the server.');
            return;
        }

        const boardImg = await drawBoard(interaction, game.get('id'));
        const boardEmbed = buildBoardEmbed(interaction)
            .setThumbnail(interaction.guild?.iconURL()!)
            .setTitle(`${interaction.guild?.name}'s board`)
            .setDescription('desc.');
        
        interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
    },
}

export  { command };
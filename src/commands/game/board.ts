import { CommandInteraction, SlashCommandBuilder} from 'discord.js';
import Command from '../../models/interfaces/Command';
import { buildBoardEmbed } from '../../utils/buildBoardEmbed';
import { drawBoard } from '../../utils/drawBoard';
import { getGameFromGuildWithStatus } from '../../utils/database';
import { buildErrorEmbed } from '../../utils/buildErrorEmbedResponse';

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('board')
            .setDescription('Shows the board of the current active game on the server.'),
    async execute(interaction: CommandInteraction) {
        const game = await getGameFromGuildWithStatus(interaction.guildId!, 'active');

        if (!game) {
            interaction.reply(buildErrorEmbed(interaction, 'There are no current active games on the server.'));
            return;
        }

        const boardImg = await drawBoard(interaction, game.players ?? []);
        const boardEmbed = buildBoardEmbed(interaction)
            .setThumbnail(interaction.guild?.iconURL()!)
            .setTitle(`${interaction.guild?.name}'s board`)
            .setDescription('desc.');
        
        interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
    },
}

export  { command };
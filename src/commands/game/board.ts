import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../../models/interfaces/Command';
import { buildBoardEmbed } from '../../utils/embeds/buildBoardEmbed';
import { drawBoard } from '../../utils/drawBoard';
import { Player } from '../../db/tables/Player';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';
import Client from '../../models/classes/Client';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('board')
        .setDescription('Shows the board of the current active game on the server.'),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);

            const boardImg = await drawBoard(game.players ?? []);
            const boardEmbed = buildBoardEmbed()
                .setThumbnail(interaction.guild?.iconURL()!)
                .setTitle(`${interaction.guild?.name}'s board - Game #${game.get('id')}`)
                .setDescription(getPlayerPositionString(game.players ?? []));

            interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
}

function getPlayerPositionString(players: Player[]) {
    let playerPositions = '';

    for (let player of players) {
        playerPositions += `- <@${player.userId}> is at square \`${player.current_square}\`\n`;
    }

    return playerPositions || 'No players.';
}

export { command };
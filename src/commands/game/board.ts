import { Client, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../../models/interfaces/Command';
import { buildBoardEmbed } from '../../utils/embeds/buildBoardEmbed';
import { drawBoard } from '../../utils/drawBoard';
import { buildErrorEmbed } from '../../utils/embeds/buildErrorEmbedResponse';
import { Player } from '../../db/tables/Player';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('board')
        .setDescription('Shows the board of the current active game on the server.'),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);

            if (!game) {
                interaction.reply(buildErrorEmbed(interaction, 'There are no current active games on the server.'));
                return;
            }

            const boardImg = await drawBoard(game.players ?? []);
            const boardEmbed = buildBoardEmbed()
                .setThumbnail(interaction.guild?.iconURL()!)
                .setTitle(`${interaction.guild?.name}'s board - Game #${game.get('id')}`)
                .setDescription(await getPlayerPositionString(game.get('id'), interaction.client));

            interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
}

async function getPlayerPositionString(gameId: number, client: Client) {
    const players = await Player.findAll({ where: { gameId: gameId } });
    let playerPositions = '';

    for (let player of players) {
        const username = client.users.cache.get(player.get('userId'));

        playerPositions += `- ${username} is at square \`${player.current_square}\`\n`;
    }

    return playerPositions;
}

export { command };
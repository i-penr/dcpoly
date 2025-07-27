import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { buildBoardEmbed } from '../../utils/embeds/buildBoardEmbed';
import { drawBoard } from '../../utils/drawBoard';
import { Player } from '../../db/tables/Player';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('board')
		.setDescription('Shows the board of the current active game on the server.'),
	async execute(interaction: ChatInputCommandInteraction) {
		try {
			const game = await getCurrentGameOrFail(interaction.guildId!);

			const boardImg = await drawBoard(game.players ?? []);
			const boardEmbed = buildBoardEmbed()
				.setThumbnail(interaction.guild?.iconURL() ?? '')
				.setTitle(`${interaction.guild?.name}'s board - Game #${game.get('id')}`)
				.setDescription(getPlayerPositionString(game.players ?? []));

			interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
		} catch (error: unknown) {
			handleCommandError(interaction, error as Error);
		}
	},
};

function getPlayerPositionString(players: Player[]) {
	let playerPositions = '';

	for (const player of players) {
		playerPositions += `- <@${player.userId}> is at square \`${player.current_square}\`\n`;
	}

	return playerPositions || 'No players.';
}

export { command };

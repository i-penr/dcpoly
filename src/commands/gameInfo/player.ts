import { ChatInputCommandInteraction, SlashCommandBuilder, User } from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { buildErrorEmbed } from '../../utils/embeds/buildErrorEmbedResponse';
import { Player } from '../../db/tables/Player';
import { buildTemplateEmbed } from '../../utils/embeds/buildTemplateEmbed';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('player')
		.setDescription('Shows information about a player in the game.')
		.addUserOption((option) =>
			option.setName('player').setDescription('The name of the player you want to see.'),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		try {
			const game = await getCurrentGameOrFail(interaction.guildId!);

			const players = game.get('players') ?? [];
			const chosenUser: User = interaction.options.getUser('player') ?? interaction.user;
			const chosenPlayer = players.find((p) => p.get('userId') === chosenUser.id);

			if (!chosenPlayer) {
				interaction.reply({
					...buildErrorEmbed(interaction, `User ${chosenUser} is not a player in the game.`),
					ephemeral: true,
				});
				return;
			}

			const playerEmbed = buildInfoEmbed(chosenPlayer, interaction, players);

			interaction.reply({ embeds: [playerEmbed] });
		} catch (error: unknown) {
			handleCommandError(interaction, error as Error);
		}
	},
};

function buildInfoEmbed(
	player: Player,
	interaction: ChatInputCommandInteraction,
	players: Player[],
) {
	const infoEmbed = buildTemplateEmbed()
		.setTitle(`${interaction.user.username}'s info`)
		.setThumbnail(interaction.user.avatarURL())
		.addFields(
			{ name: 'Game Ranking', value: getPlayerRanking(players!, player), inline: true },
			{ name: 'Money', value: `${player.get('money').toLocaleString()}$`, inline: true },
			{ name: 'Current Square', value: `${player.get('current_square')}` },
			{ name: 'Owned Properties', value: 'TODO', inline: true },
			{ name: 'Colors Owned', value: 'TODO', inline: true },
			{ name: '"Get Out of Jail Free" Cards', value: `${player.get('jailFreeCards')}` },
		);
	return infoEmbed;
}

function getPlayerRanking(playerList: Player[], player: Player): string {
	const moneySortedPlayers = playerList.sort((a, b) => {
		return a.money > b.money ? 1 : -1;
	});

	const playerPosition = moneySortedPlayers.findIndex(
		(p) => p.get('userId') === player.get('userId'),
	);

	return ordinal(playerPosition);
}

function ordinal(n: number) {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0])!;
}

export { command };

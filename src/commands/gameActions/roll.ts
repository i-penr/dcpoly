import {
	ButtonStyle,
	ChatInputCommandInteraction,
	MessagePayload,
	SlashCommandBuilder,
} from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { buildBoardEmbed } from '../../utils/embeds/buildBoardEmbed';
import { drawBoard } from '../../utils/drawBoard';
import { promptJailActionAndCheckIfPlays } from '../../utils/turns/jailTurn';
import { Player } from '../../db/tables/Player';
import { Game } from '../../db/tables/Game';
import { Turn } from '../../db/tables/Turn';
import { rollDices } from '../../utils/actions/rollDices';
import { goToJail } from '../../utils/actions/goToJail';
import { useCard } from '../../utils/turns/cardTurn';
import { buyProperty, getPropertyFromId } from '../../utils/actions/propertyActions';
import DiscordResponse from '../../models/classes/DiscordResponse';
import { getAndVerifyAll, handleCommandError } from '../../utils/validations';
import { buildPropertyEmbed } from '../../utils/embeds/buildPropertyEmbed';
import { getSquareById } from '../../utils/actions/squareActions';
import type Square from '../../models/interfaces/Square';
import { propertyTurn } from '../../utils/turns/propertyTurn';
import { createButtonCollector } from '../../utils/createButtonCollector';
// import { stationTurn } from '../../utils/turns/stationTurn';

const command: Command = {
	data: new SlashCommandBuilder().setName('roll').setDescription('Rolls the dice!'),
	async execute(interaction: ChatInputCommandInteraction) {
		try {
			const { player, playerTurn, game } = await getAndVerifyAll(interaction);
			const { result1, result2 } = rollDices();

			await interaction.deferReply();

			if (player.get('jailStatus') !== -1) {
				const continuesPlaying = await promptJailActionAndCheckIfPlays(
					player,
					interaction,
					result1,
					result2,
				);
				if (!continuesPlaying) { 
					updateTurn(game, playerTurn);
					return;
				}
			}

			const squareNumber = await executePlayerMove(player, playerTurn, result1 + result2);
			const square = getSquareById(squareNumber);

			let responseBuilder = new DiscordResponse();

			if (hasRolledDoublesThriceInARow(result1 === result2, player)) {
				const doubleTroubleEmbed = buildBoardEmbed()
					.setTitle('You rolled doubles 3 times in a row.')
					.setDescription(
						'You are going to jail for the next `3` turns. You can get out of jail by paying `50$`, rolling doubles, or using a `Get out of Jail Card`',
					)
					.setColor('Orange');

				await goToJail(player);
				await player.update({ doubleRollStreak: 0 });

				responseBuilder.embeds.push(doubleTroubleEmbed);
			} else {
				if (result1 === result2)
					await player.update({ doubleRollStreak: player.get('doubleRollStreak') + 1 });
				responseBuilder = await handleSquareAction(player, square!, game);
			}

			responseBuilder.addButtons({ id: 'endTurn', label: 'End Turn', style: ButtonStyle.Danger });

			const boardImg = await drawBoard(game.players!);

			responseBuilder.response = await interaction.followUp({
				...(responseBuilder.generateResponsePayload() as MessagePayload),
				files: [boardImg],
				content: `You rolled a \`${result1}\` and a \`${result2}\` 🎲`,
			});

			await handleButtonInteractions(interaction, responseBuilder, square, player);
			await updateTurn(game, playerTurn);
		} catch (error: unknown) {
			handleCommandError(interaction, error as Error);
		}
	},
};

function hasRolledDoublesThriceInARow(doubles: boolean, player: Player) {
	return doubles && player.get('doubleRollStreak') === 2;
}

async function executePlayerMove(
	player: Player,
	playerTurn: Turn,
	squaresMoved: number,
): Promise<number> {
	const newSquare = (squaresMoved + player.get('current_square')) % 40;

	await player.update({ current_square: newSquare });
	await playerTurn.update({ hasRolled: true });

	return newSquare;
}

async function handleSquareAction(
	player: Player,
	square: Square,
	game: Game,
): Promise<DiscordResponse> {
	const responseBuilder = new DiscordResponse();
	responseBuilder.embeds[0] = buildBoardEmbed().setTitle(`You landed on \`${square.name}\``);

	if (square.cost) {
		await player.update({
			money: player.money - square.cost,
			net_worth: player.net_worth - square.cost,
		});
	}

	switch (square.type) {
		case 'tax':
			responseBuilder.embeds[0].setDescription(`You paid \`${square.cost}$\` to the bank`);
			break;
		case 'visit_jail':
			responseBuilder.embeds[0].setDescription("Don't worry, you are just visiting");
			break;
		case 'free_space':
			responseBuilder.embeds[0].setDescription('Just take a break.');
			break;
		case 'start':
			responseBuilder.embeds[0].setDescription(
				`You earned \`${square.cost}$\` for completing a lap!`,
			);
			break;
		case 'jail':
			await goToJail(player);
			responseBuilder.embeds[0].setDescription(
				'You are going to jail for the next `3` turns. You can get out of jail by paying `50$`, rolling doubles, or using a `Get out of Jail Card`',
			);
			break;
		case 'card': {
			const cardEmbed = await useCard(player);
			if (cardEmbed) {
				responseBuilder.embeds[0].setDescription('You take a `Chance Card` from the deck...');
				responseBuilder.embeds.push(cardEmbed);
			}
			break;
		}
		case 'property':
			await propertyTurn(square.id, game, responseBuilder, player);
			break;
		case 'station':
			await stationTurn(square.id, game, responseBuilder, player);
			break;
	}

	return responseBuilder;
}

async function handleButtonInteractions(
	interaction: ChatInputCommandInteraction,
	responseBuilder: DiscordResponse,
	square: Square,
	player: Player,
): Promise<void> {
	const collector = createButtonCollector(responseBuilder.response!, interaction);

	collector?.on('end', () => {
		markTurnAsEnded();
	});

	const property = getPropertyFromId(square.id);

	collector?.on('collect', async (b) => {
		try {
			switch (b.customId) {
				case 'buyProperty':
					if (!property) throw 'Buy Property Error';

					await buyProperty(property, player);

					responseBuilder.actionRow.components[0]!.setDisabled(true);
					await interaction.followUp(responseBuilder.generateResponsePayload() as MessagePayload);

					interaction.followUp(
						`You bought the property \`${property.name}\` for \`${property.price}$\`.\nYou now have \`${player!.money}$\` left.`,
					);

					break;
				case 'inspectProperty': {
					if (!property) throw 'Inspect Property Error';

					const embed = await buildPropertyEmbed(property);

					responseBuilder.actionRow.components[1]!.setDisabled(true);
					interaction.followUp({
						embeds: [embed],
						content: 'You clicked on `See Property Details`:',
					});
					await interaction.followUp(responseBuilder.generateResponsePayload() as MessagePayload);

					break;
				}
				case 'endTurn':
				default:
					throw 'Turn Ended';
			}
		} catch {
			collector.stop();
		}
	});

	// Remove buttons & notify
	function markTurnAsEnded() {
		responseBuilder.response?.edit({ components: [] });
		interaction.followUp('***TURN ENDED***');
	}
}

async function updateTurn(game: Game, playerTurn: Turn): Promise<void> {
	const nextTurn = (game.get('currentTurn') + 1) % game.get('players')!.length;
	await game.update({ currentTurn: nextTurn });
	await playerTurn.update({ hasRolled: false });
}

export { command };

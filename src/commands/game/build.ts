import {
	type ColorResolvable,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	AttachmentBuilder,
} from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { getProperties } from '../../utils/actions/propertyActions';
import type Property from '../../models/interfaces/Property';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';
import { PropertyGame } from '../../db/tables/PropertyGame';
import { buildTemplateEmbed } from '../../utils/embeds/buildTemplateEmbed';
import DiscordResponse from '../../models/classes/DiscordResponse';
import { Player } from '../../db/tables/Player';
import { getSelectedPropertyData, promptOperation } from '../../utils/ownedPropertyOperations';
import { Game } from '../../db/tables/Game';

const properties = getProperties();

type ValidBuildingNumber = 0 | 1 | 2 | 3 | 4 | 5;

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('build')
		.setDescription('Build a house or hotel in one of your properties')
		.addIntegerOption((option) => {
			option
				.setName('property-name')
				.setDescription('The property (owned by you) where you want to build.')
				.setRequired(true);

			properties.forEach((property: Property) => {
				option.addChoices({ name: property.name, value: property.id });
			});

			return option;
		})
		.addIntegerOption((option) =>
			option
				.setName('num-buildings')
				.setDescription('The number of buildings you want to build (default == 1)'),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		try {
			const game = await getCurrentGameOrFail(interaction.guildId!);
			const { propertyInGame, selectedProperty } = await getSelectedPropertyData(game, interaction);

			await validateOperationConditions(selectedProperty, game, interaction);

			const chosenNumBuildings = interaction.options.getInteger('num-buildings') ?? 1;
			const { actualNumBuildings, finalNumBuildings, totalCost } = calculateOperationDetails(
				propertyInGame,
				chosenNumBuildings,
				selectedProperty,
			);

			const responseBuilder = buildConfirmationResponse(
				selectedProperty,
				actualNumBuildings as ValidBuildingNumber,
				finalNumBuildings as ValidBuildingNumber,
				totalCost,
				interaction,
			);
			const willBuild = await promptOperation(responseBuilder, interaction);

			if (!willBuild) {
				interaction.followUp('Operation cancelled.');
				return;
			}

			const player = propertyInGame.owner;

			await buyBuildings(
				player!,
				propertyInGame,
				finalNumBuildings as ValidBuildingNumber,
				totalCost,
			);

			interaction.followUp(`
                You have built \`${actualNumBuildings}\` houses in \`${selectedProperty.name}\` for \`${totalCost}\`. \
                \n \
                \nThe rent for \`${selectedProperty.name}\` has risen to \`${selectedProperty.rentProg[finalNumBuildings]}\`.\
                \n \
                \nYou now have \`${propertyInGame.owner?.money}\`.`);
		} catch (error: unknown) {
			handleCommandError(interaction, error as Error);
		}
	},
};

async function validateOperationConditions(
	selectedProperty: Property,
	game: Game,
	interaction: ChatInputCommandInteraction,
) {
	if (!(await userOwnsAllColorInGame(selectedProperty.color, game.id, interaction.user.id))) {
		throw new Error(
			`You cannot build in color ${selectedProperty.color}. You need to **own all properties in that color** first!`,
		);
	}
}

function calculateOperationDetails(
	propertyInGame: PropertyGame,
	chosenNumBuildings: number,
	selectedProperty: Property,
) {
	const alreadyBuilt = propertyInGame.numBuildings;
	// If user wants to build more than the max, build the max
	const actualNumBuildings =
		5 - alreadyBuilt - chosenNumBuildings < 0 ? 5 - alreadyBuilt : chosenNumBuildings;
	const finalNumBuildings = propertyInGame.numBuildings + actualNumBuildings;
	const totalCost = finalNumBuildings * selectedProperty.buildingCost;
	return { actualNumBuildings, finalNumBuildings, totalCost };
}

function buildConfirmationResponse(
	selectedProperty: Property,
	actualNumBuildings: ValidBuildingNumber,
	finalNumBuildings: ValidBuildingNumber,
	totalCost: number,
	interaction: ChatInputCommandInteraction,
) {
	const buildingIcon = new AttachmentBuilder('./assets/build.png');

	const bulidEmbed = buildTemplateEmbed()
		.setTitle(`Build operation summary in \`${selectedProperty.name}\``)
		.setDescription(
			`
            You want to build \`${actualNumBuildings}\` house${actualNumBuildings === 1 ? '' : 's'} in \`${selectedProperty.name}\`
            Your property will have ${finalNumBuildings === 5 ? '1 hotel' : `${finalNumBuildings} house${finalNumBuildings === 1 ? '' : 's'}`}
                        
            You will need to pay \`${totalCost}\`

            Do you want to confirm the operation?`,
		)
		.setColor(selectedProperty.color)
		.setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.avatarURL()! })
		.setThumbnail('attachment://build.png');

	const responseBuilder = new DiscordResponse([bulidEmbed], [buildingIcon]);
	return responseBuilder;
}

async function userOwnsAllColorInGame(color: ColorResolvable, gameId: number, userId: string) {
	const sameColorPropertiesIds = properties
		.filter((prop: Property) => prop.color === color)
		.map((prop: Property) => prop.id);
	const sameColorPropertiesInGame = await PropertyGame.findAll({
		where: { gameId: gameId, id: sameColorPropertiesIds },
	});

	return sameColorPropertiesInGame.every(({ ownerId }) => ownerId === userId);
}

async function buyBuildings(
	buyer: Player,
	propertyGame: PropertyGame,
	finalNumBuildings: ValidBuildingNumber,
	cost: number,
) {
	const userMoneyLeft = buyer.money - cost;

	if (userMoneyLeft < 0)
		throw new Error(`User does not have enough money:\nMoney Left: \`${buyer.money}\``);

	await propertyGame.update({ numBuildings: finalNumBuildings });
	await buyer.update({ money: userMoneyLeft, net_worth: buyer.net_worth + cost / 2 });
}

export { command };

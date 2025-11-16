import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	AttachmentBuilder,
	type ColorResolvable,
} from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { getProperties } from '../../utils/actions/propertyActions';
import type Property from '../../models/interfaces/Property';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';
import { PropertyGame } from '../../db/tables/PropertyGame';
import { canSellInPropertyInColor, getSelectedPropertyData, promptOperation } from '../../utils/ownedPropertyOperations';
import { buildTemplateEmbed } from '../../utils/embeds/buildTemplateEmbed';
import DiscordResponse from '../../models/classes/DiscordResponse';
import { Player } from '../../db/tables/Player';
import type { Game } from '../../db/tables/Game';

const properties = getProperties();

type ValidBuildingNumber = 0 | 1 | 2 | 3 | 4 | 5;

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('sellbuilding')
		.setDescription('Sell one of your buildings in an owned property')
        .addIntegerOption((option) => {
			option
				.setName('property-name')
				.setDescription('The property (owned by you) where the buildings are.')
				.setRequired(true);

			properties.forEach((property: Property) => {
				option.addChoices({ name: property.name, value: property.id });
			});

			return option;
		}),
	async execute(interaction: ChatInputCommandInteraction) {
		try {
			const game = await getCurrentGameOrFail(interaction.guildId!);
			const { propertyInGame, selectedProperty } = await getSelectedPropertyData(game, interaction);
			const responseBuilder = buildConfirmationResponse(selectedProperty, propertyInGame, interaction);

			await validateOperationConditions(propertyInGame, interaction.member?.user.id || '', selectedProperty.color, game);

			const willSell = await promptOperation(responseBuilder, interaction);

			if (!willSell) {
				interaction.followUp('Operation cancelled.');
				return;
			}

			const sellValue = selectedProperty.buildingCost / 2;
			sellBuildingInProperty(propertyInGame, propertyInGame.owner!, sellValue);

			interaction.followUp(`
                You have **sold** a building in \`${selectedProperty.name}\`. You've earned \`${sellValue}\` \
                \n \
                \nThere are now \`${propertyInGame.numBuildings}\` houses in \`${selectedProperty.name}\``);
		} catch (error: unknown) {
			handleCommandError(interaction, error as Error);
		}
	},
};

async function validateOperationConditions(property: PropertyGame, userId: string, color: ColorResolvable, game: Game) {
	if (!property.owner || property.owner.userId !== userId) {
		throw new Error('You don\'t own that property!');
	}

	if (property.numBuildings === 0) {
		throw new Error('There aren\'t any buildings on that property!');
	}

	if (!(await canSellInPropertyInColor(property, color, game))) {
		throw new Error('You can’t sell a building from this property. \
			You must sell buildings evenly across the properties in a color group.')
	}
}

function buildConfirmationResponse(
	selectedProperty: Property,
	propertyGame: PropertyGame,
	interaction: ChatInputCommandInteraction,
) {
	const mortgageIcon = new AttachmentBuilder('./assets/sellbuildings.jpg');
	const mortgageEmbed = buildTemplateEmbed()
		.setTitle(`Sell operation summary in \`${selectedProperty.name}\``)
		.setDescription(
			`
                 You are going to **sell** ${propertyGame.numBuildings < 5 ? '1 house' : '1 hotel'} in \`${selectedProperty.name}\`.\n 
				 
				 You will earn\`${selectedProperty.buildingCost / 2}\`, ${selectedProperty.name} will have \
				 ${propertyGame.numBuildings - 1 } houses and the new rent for ${selectedProperty.name} will be \`${selectedProperty.rentProg[propertyGame.numBuildings - 1]}\`

                 \nDo you confirm the operation?`,
		)
		.setColor(selectedProperty.color)
		.setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.avatarURL()! })
		.setThumbnail('attachment://sellbuildings.jpg');

	const responseBuilder = new DiscordResponse([mortgageEmbed], [mortgageIcon]);
	return responseBuilder;
}

async function sellBuildingInProperty(property: PropertyGame, player: Player, sellValue: number) {
	await player.update({ money: player.money + sellValue  });
	await property.update({ numBuildings: property.numBuildings - 1 as ValidBuildingNumber });
}

export { command };

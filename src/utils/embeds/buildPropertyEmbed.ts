import { Game } from '../../db/tables/Game';
import { PropertyGame } from '../../db/tables/PropertyGame';
import type Property from '../../models/interfaces/Property';
import { buildTemplateEmbed } from './buildTemplateEmbed';

export const buildPropertyEmbed = async (property: Property, game?: Game) => {
	const propertyGame = game
		? (await PropertyGame.findOne({ where: { id: property.id, gameId: game.id } })) : null;

	return buildTemplateEmbed()
		.setColor(property.color)
		.setTitle(property.name)
		.setDescription(await getPropertyDataString(property, propertyGame!, game ?? undefined))
		.addFields(
			property.rentProg.map((rent: number, index: number) => ({
				name: `Rent with ${index !== 5 ? `${index} house${index !== 1 ? 's' : ''}` : 'hotel'}`,
				value: rent.toString(),
				inline: true,
			})),
		);
};

async function getPropertyDataString(property: Property, propertyGame: PropertyGame, game?: Game) {
	const data: {
		'Price': string;
		'Mortgage': string;
		'Cost per Building': string;
		'Owned By'?: string;
		'Buildings'?: string;
	} = {
		'Price': property.price.toLocaleString(),
		'Mortgage': property.mortgage.toLocaleString(),
		'Cost per Building': property.buildingCost.toLocaleString(),
	};

	// If there is a game running, add these game-related entries
	if (game && propertyGame) {
		data['Owned By'] = propertyGame.ownerId ? `<@${propertyGame.ownerId}>` : 'Nobody';
		data['Buildings'] = propertyGame.numBuildings === 0 ? 'None' : propertyGame.numBuildings === 5 ? '1 hotel' : `${propertyGame.numBuildings} houses.`
	}

	return Object.entries(data).reduce((acc, curr) => acc + `- **${curr[0]}**: ${curr[1]}\n`, '');
}

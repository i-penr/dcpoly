import { Game } from '../../db/tables/Game';
import { PropertyGame } from '../../db/tables/PropertyGame';
import Client from '../../models/classes/Client';
import type Property from '../../models/interfaces/Property';
import { buildTemplateEmbed } from './buildTemplateEmbed';

export const buildPropertyEmbed = async (property: Property, game?: Game) => {
	const owner = game
		? (await PropertyGame.findOne({ where: { id: property.id, gameId: game.id } }))?.ownerId
		: null;

	return buildTemplateEmbed()
		.setColor(property.color)
		.setTitle(property.name)
		.setDescription(await getPropertyDataString(property, owner!, game ?? undefined))
		.addFields(
			property.rentProg.map((rent: number, index: number) => ({
				name: `Rent with ${index !== 5 ? `${index} house${index !== 1 ? 's' : ''}` : 'hotel'}`,
				value: rent.toString(),
				inline: true,
			})),
		);
};

async function getPropertyDataString(property: Property, owner: string | null, game?: Game) {
	const data: {
		'Price': string;
		'Mortgage': string;
		'Cost per Building': string;
		'Owned By'?: string;
	} = {
		'Price': property.price.toLocaleString(),
		'Mortgage': property.mortgage.toLocaleString(),
		'Cost per Building': property.buildingCost.toLocaleString(),
	};

	// If there is a game running, add these game-related entries
	if (game && game.status === 'active') {
		data['Owned By'] = owner ? (await Client.getInstance().users.fetch(owner)).username : 'Nobody';
	}

	return Object.entries(data).reduce((acc, curr) => acc + `- **${curr[0]}**: ${curr[1]}\n`, '');
}

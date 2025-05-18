import Client from "../../models/classes/Client";
import { Player } from "../../db/tables/Player";
import { PropertyGame } from "../../db/tables/PropertyGame";
import Property from "../../models/interfaces/Property";
import { getPropertyFromId, createPropertyPromptActionRow } from "../actions/propertyActions";
import Square from "../../models/interfaces/Square";
import { Game } from "../../db/tables/Game";
import DiscordResponse from "../../models/classes/DiscordResponse";

export async function propertyTurn(square: Square, game: Game, responseBuilder: DiscordResponse, player: Player) {
    const property: Property = getPropertyFromId(square.id);
    const propertyGame = await PropertyGame.findOne({ where: { gameId: game.id, id: property.id }, include: Player });

    if (!property || !propertyGame) throw new Error('Property does not exist (internal error).');

    const owner = propertyGame.owner;

    responseBuilder.embeds[0].setTitle(`You landed on \`${property.name}\``);
    responseBuilder.embeds[0].setColor(property.color);

    if (!owner) {
        responseBuilder.embeds[0].setDescription(`This property is not owned by anyone.\n\nWhat do you want to do?\n\n- **Current Money** \`${player.money}$\`\n- **Price** \`${property.price}\``);
        responseBuilder.actionRow.addComponents(createPropertyPromptActionRow(player.get('money') >= property.price));
        return;
    }

    const rent = property.rentProg[propertyGame.numBuildings];

    if (player.userId === owner.userId) {
        responseBuilder.embeds[0].setDescription(`This property is owned by you. Enjoy your stay!`);
    } else {
        responseBuilder.embeds[0].setDescription(`This property is owned by ${await Client.getInstance().users.fetch(owner.userId)}.\n
                    You will need to pay them \`${rent}\`$ for rent.`);

        await player.update({ money: player.money - rent });
        await owner.update({ money: owner!.money + rent });
    }
}
import Client from "../../models/classes/Client";
import { Player } from "../../db/tables/Player";
import { PropertyGame } from "../../db/tables/PropertyGame";
import type Property from "../../models/interfaces/Property";
import { getPropertyFromId, createPropertyPromptActionRow } from "../actions/propertyActions";
import type Square from "../../models/interfaces/Square";
import { Game } from "../../db/tables/Game";
import DiscordResponse from "../../models/classes/DiscordResponse";
import { Turn } from "../../db/tables/Turn";

export async function propertyTurn(square: Square, game: Game, responseBuilder: DiscordResponse, player: Player) {
    const property: Property = getPropertyFromId(square.id);
    const propertyGame = await PropertyGame.findOne({ where: { gameId: game.id, id: property.id }, include: { model: Player, as: 'owner' }, logging: console.log });

    if (!property || !propertyGame || !responseBuilder.embeds[0]) throw new Error('Property does not exist (internal error).');

    const owner = propertyGame.owner;

    responseBuilder.embeds[0].setTitle(`You landed on \`${property.name}\``);
    responseBuilder.embeds[0].setColor(property.color);

    if (!owner) {
        responseBuilder.embeds[0].setDescription(`This property is not owned by anyone.\n\nWhat do you want to do?\n\n- **Current Money** \`${player.money}$\`\n- **Price** \`${property.price}\``);
        responseBuilder.actionRow.addComponents(createPropertyPromptActionRow(player.get('money') >= property.price));
        return;
    }

    const rent = property.rentProg[propertyGame.numBuildings]!;

    if (player.userId === owner.userId) {
        responseBuilder.embeds[0].setDescription(`This property is owned by you. Enjoy your stay!`);
    } else {
        const userHasEnoughMoney = player.money - rent >= 0;
        const ownerName = await Client.getInstance().users.fetch(owner.userId);

        if (userHasEnoughMoney) {
            responseBuilder.embeds[0].setDescription(`
                This property is owned by ${ownerName}.\n
                You will need to pay them \`${rent}\`$ for rent.
            `);
        } else if (player.net_worth - rent >= 0) {
            responseBuilder.embeds[0].setDescription(`
                You need to pay ${ownerName} \`${rent}\`,
                but you don't have enough money. Money left: \`${player.money}\`.

                You need \`${player.money - rent}\` to pay your debts. Mortgage owned properties,
                or sell any built buildings, if any. Or else go bankrupt and lose the game.
            `);
        } else {
            responseBuilder.embeds[0].setDescription(`
                You need to pay ${ownerName} \`${rent}\`,
                but you don't have enough money. Money left: \`${player.money}\`.

                Your owned properties and buildings aren't enough to cover your debt, so you are
                about to be declared **bankrupt**.

                **You are out of the game**.
            `);

            await Turn.destroy({ where: { userId: player.userId, gameId: game.id } })
        }

        await player.update({ money: player.money - rent, net_worth: player.net_worth - rent });
        await owner.update({ money: owner!.money + rent, net_worth: player.net_worth + rent });
    }
}
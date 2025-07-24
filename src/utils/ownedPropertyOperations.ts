import { ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import { Game } from "../db/tables/Game";
import { PropertyGame } from "../db/tables/PropertyGame";
import { getPropertyFromId } from "./actions/propertyActions";
import DiscordResponse, { ButtonData } from "../models/classes/DiscordResponse";
import { createButtonCollector } from "./createButtonCollector";
import { Player } from "../db/tables/Player";

export async function getPropertyData(game: Game, interaction: ChatInputCommandInteraction) {
    const selectedPropertyId = await (interaction.options as any).getInteger('property-name');
    const selectedProperty = getPropertyFromId(selectedPropertyId);
    const propertyInGame = await PropertyGame.findOne({ where: { gameId: game.id, ownerId: interaction.user.id, id: selectedPropertyId }, include: { model: Player, as: 'owner' } });

    if (!propertyInGame) {
        throw new Error(`Sorry! You don\'t own property \`${selectedProperty.name}\` in the current game (game #${game.id})`);
    }

    return { propertyInGame, selectedProperty };
}

export function setUpConfirmationButtons(): ButtonData[] {
    return [
        {
            id: 'confirmBuild',
            label: 'Yes',
            style: ButtonStyle.Success
        },
        {
            id: 'cancelBuild',
            label: 'No',
            style: ButtonStyle.Danger
        }
    ]
}

export async function promptOperation(responseBuilder: DiscordResponse, interaction: ChatInputCommandInteraction) {
    responseBuilder.addButtons(...setUpConfirmationButtons());
    responseBuilder.response = await interaction.reply(responseBuilder.generateResponsePayload());
    const willBuild = await handleButtonInteractions(responseBuilder, interaction);
    responseBuilder.response.edit({ components: [] });

    return willBuild;
}

function handleButtonInteractions(responseBuilder: DiscordResponse, interaction: ChatInputCommandInteraction) {
    return new Promise((resolve) => {
        const collector = createButtonCollector(responseBuilder.response!, interaction);

        collector?.on('collect', async (b: { customId: any; }) => {
            try {
                switch (b.customId) {
                    case 'confirmBuild':
                        return resolve(true);
                    case 'cancelBuild': default:
                        throw 'Turn Ended';
                }
            } catch (e: any) {
                collector.stop();
                return resolve(false);
            }
        });

        collector?.on('end', (_collected: any) => {
            return resolve(false);
        });
    });
}
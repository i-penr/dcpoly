import { ButtonStyle, ColorResolvable, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from '../../models/interfaces/Command';
import { getProperties, getPropertyFromId } from "../../utils/actions/propertyActions";
import Property from "../../models/interfaces/Property";
import { getCurrentGameOrFail, handleCommandError } from "../../utils/validations";
import { PropertyGame } from "../../db/tables/PropertyGame";
import { Game } from "../../db/tables/Game";
import { Op } from "sequelize";

const properties = getProperties();

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('mortgage')
        .setDescription('Mortgage one of your properties (only if its color has no buildings)')
        .addIntegerOption(option => {
            option.setName('property-name')
                .setDescription('The property (owned by you) that you want to mortgage.')
                .setRequired(true);

            properties.forEach((property: Property) => {
                option.addChoices({ name: property.name, value: property.id });
            });

            return option;
        }),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);
            const { propertyInGame, selectedProperty } = await getPropertyData(game, interaction);
            
            if (await buildingsExistInColor(selectedProperty.color, game.id)) {
                throw new Error(`You cannot mortgage the property \`${selectedProperty.name}\` because there are buildings present in color \`${selectedProperty.color}\``);
            }

            interaction.reply(
                `You are going to mortgage the property \`${selectedProperty.name}\`. It will give you \`${selectedProperty.mortgage}\` \
                 \nYour property will be flagged as \`mortgaged\`, so **no rent will be collected from it** \
                 \nTo unmortgage this property, you will need to pay \`${selectedProperty.mortgage * 1.1}\` \
                 \n \
                 \nDo you want to confirm the operation?
            `);
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
}

async function getPropertyData(game: Game, interaction: ChatInputCommandInteraction) {
    const selectedPropertyId = await (interaction.options as any).getInteger('property-name');
    const selectedProperty = getPropertyFromId(selectedPropertyId);
    const propertyInGame = await PropertyGame.findOne({ where: { gameId: game.id, ownerId: interaction.user.id, id: selectedPropertyId } });

    if (!propertyInGame) {
        throw new Error(`Sorry! You don\'t own this property in the current game (game #${game.id})`);
    }

    return { propertyInGame, selectedProperty };
}

async function buildingsExistInColor(color: ColorResolvable, gameId: number) {
    const propertiesInColor = getProperties().filter((p) => p.color = color ).map((p) => p.id);
    const propertiesInColorInGame =  await PropertyGame.findAll({ where: { gameId: gameId, id: { [Op.in]: propertiesInColor } } });

    return propertiesInColorInGame.some((p) => p.numBuildings > 0);
}

export { command };
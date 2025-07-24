import { ColorResolvable, ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import Command from '../../models/interfaces/Command';
import { getProperties } from "../../utils/actions/propertyActions";
import Property from "../../models/interfaces/Property";
import { getCurrentGameOrFail, handleCommandError } from "../../utils/validations";
import { PropertyGame } from "../../db/tables/PropertyGame";
import { Op } from "sequelize";
import { getPropertyData, promptOperation, setUpConfirmationButtons } from "../../utils/ownedPropertyOperations";
import { buildTemplateEmbed } from "../../utils/embeds/buildTemplateEmbed";
import DiscordResponse from "../../models/classes/DiscordResponse";
import { Player } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";

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

            await validateOperationConditions(propertyInGame, selectedProperty, game);

            const responseBuilder = buildConfirmationResponse(selectedProperty);
            const willBuild = await promptOperation(responseBuilder, interaction);

            if (!willBuild) {
                interaction.followUp('Operation cancelled.');
                return;
            }

            mortgageProperty(propertyInGame, propertyInGame.owner!, selectedProperty.mortgage);

            interaction.followUp(`
                You have mortgaged \`${selectedProperty.name}\`. You've earned \`${selectedProperty.mortgage}\` \
                \n \
                \nNo rent will be collected from this property.\
                \n \
                \nTo unmortgage this property, run \`/unmortgage\`. The unmortgage cost will be \`${selectedProperty.mortgage * 1.1}\`
                \nYou now have \`${propertyInGame.owner?.money}\`.`
            );

        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
}

function buildConfirmationResponse(selectedProperty: Property) {
    const mortgageIcon = new AttachmentBuilder('./assets/mortgage.png');
    const mortgageEmbed = buildTemplateEmbed()
        .setTitle(`Mortgage operation summary in \`${selectedProperty.name}\``)
        .setDescription(`
                 You are going to mortgage the property \`${selectedProperty.name}\`. It will give you \`${selectedProperty.mortgage}\` \
                 \n\nYour property will be flagged as \`mortgaged\`, so **no rent will be collected from it** \
                 \n\nTo unmortgage this property, you will need to pay \`${selectedProperty.mortgage * 1.1}\` \
                 \n \
                 \nDo you want to confirm the operation?`
        )
        .setColor(selectedProperty.color)
        .setThumbnail('attachment://mortgage.png');

    const responseBuilder = new DiscordResponse([mortgageEmbed], [mortgageIcon]);
    responseBuilder.addButtons(...setUpConfirmationButtons());
    return responseBuilder;
}

async function validateOperationConditions(propertyInGame: PropertyGame, selectedProperty: Property, game: Game) {
    if (propertyInGame.mortgaged) {
        throw new Error(`Property ${selectedProperty.name} is already mortgaged. Run \`/unmortgage\` to unmortgage it for \`${selectedProperty.mortgage * 1.1}\``);
    }

    if (await buildingsExistInColor(selectedProperty.color, game.id)) {
        throw new Error(`You cannot mortgage the property \`${selectedProperty.name}\` because there are buildings present in color \`${selectedProperty.color}\``);
    }
}

async function buildingsExistInColor(color: ColorResolvable, gameId: number) {
    const propertiesInColor = getProperties().filter((p) => p.color = color).map((p) => p.id);
    const propertiesInColorInGame = await PropertyGame.findAll({ where: { gameId: gameId, id: { [Op.in]: propertiesInColor } } });

    return propertiesInColorInGame.some((p) => p.numBuildings > 0);
}

async function mortgageProperty(property: PropertyGame, player: Player, mortgageMoney: number) {
    await property.update({ mortgaged: true });
    await player.update({ money: player.money + mortgageMoney });
}

export { command };
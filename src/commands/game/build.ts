import { ButtonStyle, ColorResolvable, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import Command from '../../models/interfaces/Command';
import { getProperties, getPropertyFromId } from "../../utils/actions/propertyActions";
import Property from "../../models/interfaces/Property";
import { getCurrentGameOrFail, handleCommandError } from "../../utils/validations";
import { PropertyGame } from "../../db/tables/PropertyGame";
import { buildTemplateEmbed } from "../../utils/embeds/buildTemplateEmbed";
import DiscordResponse, { ButtonData } from "../../models/classes/DiscordResponse";
import { createButtonCollector } from "../../utils/createButtonCollector";
import { Player } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";

const properties = getProperties();

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('build')
        .setDescription('Build a house or hotel in one of your properties')
        .addIntegerOption(option => {
            option.setName('property-name')
                .setDescription('The property (owned by you) where you want to build.')
                .setRequired(true);

            properties.forEach((property: Property) => {
                option.addChoices({ name: property.name, value: property.id });
            });

            return option;
        })
        .addIntegerOption(option =>
            option.setName('num-buildings')
                .setDescription('The number of buildings you want to build (default == 1)')
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);
            const { propertyInGame, selectedProperty } = await getPropertyData(game, interaction);

            if (!await userOwnsAllColorInGame(selectedProperty.color, game.id, interaction.user.id)) {
                throw new Error(`You cannot build in color ${selectedProperty.color}. You need to **own all properties in that color** first!`);
            }

            const chosenNumBuildings = await interaction.options.getInteger('num-buildings') ?? 1;
            const { actualNumBuildings, finalNumBuildings, totalCost } = calculateOperationDetails(propertyInGame, chosenNumBuildings, selectedProperty);
            const willBuild = await promptBuy(selectedProperty, actualNumBuildings, finalNumBuildings, totalCost, interaction);

            if (!willBuild) { 
                interaction.followUp('Operation cancelled.');
                return;
            }

            const player = await Player.findOne({ where: { gameId: game.id, userId: interaction.user.id } });

            await buyBuildings(player!, propertyInGame, finalNumBuildings, totalCost);

            interaction.followUp(`
                You have built \`${actualNumBuildings}\` houses in \`${selectedProperty.name}\`. \
                \n \
                \nThe rent for \`${selectedProperty.name}\` has risen to \`${selectedProperty.rentProg[finalNumBuildings]}\`.\
                \n \
                \nYou now have \`${1}\`.`
            );

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
        throw new Error(`Sorry! You don\'t own property \`${selectedProperty.name}\` in the current game (game #${game.id})`);
    }

    return { propertyInGame, selectedProperty };
}

function calculateOperationDetails(propertyInGame: PropertyGame, chosenNumBuildings: any, selectedProperty: Property) {
    const alreadyBuilt = propertyInGame.numBuildings;
    // If user wants to build more than the max, build the max
    const actualNumBuildings = 5 - alreadyBuilt - chosenNumBuildings < 0 ? 5 - alreadyBuilt : chosenNumBuildings;
    const finalNumBuildings = propertyInGame.numBuildings + actualNumBuildings;
    const totalCost = finalNumBuildings * selectedProperty.buildingCost;
    return { actualNumBuildings, finalNumBuildings, totalCost };
}

async function promptBuy(selectedProperty: Property, actualNumBuildings: any, finalNumBuildings: any, totalCost: number, interaction: ChatInputCommandInteraction) {
    const responseBuilder = buildConfirmationResponse(selectedProperty, actualNumBuildings, finalNumBuildings, totalCost);

    responseBuilder.response = await interaction.reply(responseBuilder.generateResponsePayload());
    const willBuild = await handleButtonInteractions(responseBuilder, interaction);
    responseBuilder.response.edit({ components: [] });

    return willBuild;
}

function buildConfirmationResponse(selectedProperty: Property, actualNumBuildings: 0 | 1 | 2 | 3 | 4 | 5, finalNumBuildings: 0 | 1 | 2 | 3 | 4 | 5, totalCost: number) {
    const bulidEmbed = buildTemplateEmbed()
        .setTitle(`Building summary in \`${selectedProperty.name}\``)
        .setDescription(`
            You want to build \`${actualNumBuildings}\` house${actualNumBuildings === 1 ? '' : 's'} in \`${selectedProperty.name}\`
            Your property will have ${finalNumBuildings === 5 ? '1 hotel' : `${finalNumBuildings} house${finalNumBuildings === 1 ? '' : 's'}`}
                        
            You will need to pay \`${totalCost}\`

            Do you want to confirm the operation?`
        )
        .setColor(selectedProperty.color);

    const responseBuilder = new DiscordResponse([bulidEmbed]);
    responseBuilder.addButtons(...setUpBuildConfirmationButtons());
    return responseBuilder;
}

async function userOwnsAllColorInGame(color: ColorResolvable, gameId: number, userId: string) {
    const sameColorPropertiesIds = properties.filter((prop: Property) => prop.color === color).map((prop: Property) => prop.id);
    const sameColorPropertiesInGame = await PropertyGame.findAll({ where: { gameId: gameId, id: sameColorPropertiesIds } });

    return sameColorPropertiesInGame.every(({ ownerId }) => ownerId === userId);
}

function setUpBuildConfirmationButtons(): ButtonData[] {
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

function handleButtonInteractions(responseBuilder: DiscordResponse, interaction: ChatInputCommandInteraction) {
    return new Promise((resolve) => {
        const collector = createButtonCollector(responseBuilder.response!, interaction);

        collector?.on('collect', async b => {
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

        collector?.on('end', _collected => {
            return resolve(false);
        });
    });
}

async function buyBuildings(buyer: Player, propertyGame: PropertyGame, finalNumBuildings: 0 | 1 | 2 | 3 | 4 | 5, cost: number) {
    const userMoneyLeft = buyer.money - cost;

    if (userMoneyLeft < 0) throw new Error(`User does not have enough money:\nMoney Left: \`${buyer.money}\``);

    await propertyGame.update({ numBuildings: finalNumBuildings });
    await buyer.update({ money: userMoneyLeft, net_worth: buyer.net_worth + cost / 2 });
}

export { command };
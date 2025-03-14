import {
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    ComponentType,
    SlashCommandBuilder,
} from "discord.js";
import Command from "../../models/interfaces/Command";
import { buildBoardEmbed } from "../../utils/embeds/buildBoardEmbed";
import { drawBoard } from "../../utils/drawBoard";
import { promptJailActionAndCheckIfPlays } from "../../utils/actions/jailTurn";
import { Player } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";
import { Turn } from "../../db/tables/Turn";
import { rollDices } from "../../utils/actions/rollDices";
import { goToJail } from "../../utils/actions/goToJail";
import { useCard } from "../../utils/actions/cardTurn";
import { createPropertyPromptActionRow, getPropertyFromId } from "../../utils/actions/propertyActions";
import Client from "../../models/classes/Client"
import DiscordResponse from "../../models/classes/DiscordResponse";
import { getCurrentGameOrFail, getPlayerOrFail, getPlayerTurn, handleCommandError, validateTurn } from "../../utils/validations";
import { buildPropertyEmbed } from "../../utils/embeds/buildPropertyEmbed";
import { PropertyGame } from "../../db/tables/PropertyGame";
import Property from "../../models/interfaces/Property";
import { getSquareById } from "../../utils/actions/squareActions";
import Square from "../../models/interfaces/Square";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Rolls the dice!"),
    async execute(interaction: CommandInteraction) {
        try {
            const { player, playerTurn, game } = await getAndVerifyAll(interaction);
            const { result1, result2 } = rollDices();

            await interaction.deferReply();

            if (player.get('jailStatus') !== -1) {
                const continuesPlaying = await promptJailActionAndCheckIfPlays(player, interaction, result1, result2);
                if (!continuesPlaying) return;
            }

            const squareNumber = await executePlayerMove(player, playerTurn, result1 + result2);
            const square = getSquareById(squareNumber);

            let responseBuilder = new DiscordResponse();

            if (hasRolledDoublesThriceInARow(result1 === result2, player)) {
                const doubleTroubleEmbed = buildBoardEmbed()
                    .setTitle('You rolled doubles 3 times in a row.')
                    .setDescription('You are going to jail for the next \`3\` turns. You can get out of jail by paying `50$`, rolling doubles, or using a `Get out of Jail Card`')
                    .setColor('Orange');

                await goToJail(player);
                await player.update({ doubleRollStreak: 0 });

                responseBuilder.embeds.push(doubleTroubleEmbed);
            } else {
                if (result1 === result2) await player.update({ doubleRollStreak: player.get('doubleRollStreak') + 1 });
                responseBuilder = await handleSquareAction(player, square!, game);
            }

            const endTurnButton = new ButtonBuilder()
                .setCustomId('endTurn')
                .setLabel('End Turn')
                .setStyle(ButtonStyle.Danger);
            responseBuilder.actionRow.addComponents(endTurnButton);

            const boardImg = await drawBoard(game.players!);

            const response = await interaction.editReply({
                embeds: responseBuilder.embeds, components: [responseBuilder.actionRow], files: [boardImg],
                content: `You rolled a \`${result1}\` and a \`${result2}\` 🎲`
            });

            responseBuilder.response = response;

            await handleButtonInteractions(interaction, responseBuilder, square!);
            await updateTurn(game, playerTurn);
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
};

async function getAndVerifyAll(interaction: CommandInteraction) {
    const game = await getCurrentGameOrFail(interaction.guildId!);
    const player = getPlayerOrFail(game, interaction.user.id);
    const playerTurn = await getPlayerTurn(game, player);

    await validateTurn(game, playerTurn);
    return { player, playerTurn, game };
}

function hasRolledDoublesThriceInARow(doubles: boolean, player: Player) {
    return doubles && player.get('doubleRollStreak') === 2;
}

async function executePlayerMove(player: Player, playerTurn: Turn, squaresMoved: number): Promise<number> {
    const newSquare = (squaresMoved + player.get('current_square')) % 40;

    await player.update({ current_square: newSquare });
    await playerTurn.update({ hasRolled: true });

    return newSquare;
}

async function handleSquareAction(player: Player, square: Square, game: Game): Promise<DiscordResponse> {
    const responseBuilder = new DiscordResponse();
    const boardEmbed = buildBoardEmbed()
        .setTitle(`You landed on \`${square.name}\``);

    if (square.cost) {
        await player.update({ money: player.get('money') - square.cost });
    }

    switch (square.type) {
        case 'tax':
            boardEmbed.setDescription(`You paid \`${square.cost}$\` to the bank`);
            break;
        case 'visit_jail':
            boardEmbed.setDescription('Don\'t worry, you are just visiting');
            break;
        case 'free_space':
            boardEmbed.setDescription('Just take a break.');
            break;
        case 'start':
            boardEmbed.setDescription(`You earned \`${square.cost}$\` for completing a lap!`);
            break;
        case 'jail':
            await goToJail(player);
            boardEmbed.setDescription('You are going to jail for the next \`3\` turns. You can get out of jail by paying `50$`, rolling doubles, or using a `Get out of Jail Card`');
            break;
        case 'card':
            const cardEmbed = await useCard(player);
            if (cardEmbed) {
                boardEmbed.setDescription('You take a `Chance Card` from the deck...');
                responseBuilder.embeds.push(cardEmbed);
            }
            break;
        case 'property':
            const property: Property = getPropertyFromId(square.id);
            const propertyGame = await PropertyGame.findOne({ where: { gameId: game.id, id: square.id }, include: Player });

            if (!property || !propertyGame) throw new Error('Property does not exist (internal error).');

            const owner = propertyGame.owner;

            boardEmbed.setTitle(`You laned on \`${property.name}\``);
            boardEmbed.setColor(property.color);

            if (!owner) {
                boardEmbed.setDescription(`This property is not owned by anyone.\n\nWhat do you want to do?\n\n- **Current Money** \`${player.money}$\`\n- **Price** \`${property.price}\``);
                responseBuilder.actionRow.addComponents(createPropertyPromptActionRow(player.get('money') >= property.price));
                break;
            }

            const rent = property.rentProg[propertyGame.numBuildings];

            if (player.userId === owner.userId) {
                boardEmbed.setDescription(`This property is owned by you. Enjoy your stay!`);
            } else {
                boardEmbed.setDescription(`This property is owned by ${await Client.getInstance().users.fetch(owner.userId)}.\n
                    You will need to pay them \`${rent}\`$ for rent.`);

                await player.update({ money: player.money - rent });
                await owner!.update({ money: owner!.money + rent });
            }
            break;
    }

    responseBuilder.embeds.unshift(boardEmbed);

    return responseBuilder;
}

async function handleButtonInteractions(interaction: CommandInteraction, responseBuilder: DiscordResponse, square: Square): Promise<void> {
    const collector = responseBuilder.response?.createMessageComponentCollector({
        componentType: ComponentType.Button, time: 60000,
        filter: (i) => {
            i.deferUpdate();
            return i.user.id === interaction.user.id
        }
    });

    collector?.on('end', _collected => {
        markTurnAsEnded();
    });

    collector?.on('collect', async b => {
        try {
            switch (b.customId) {
                case 'buyProperty':
                    await executeBuy(square, interaction, responseBuilder);
                    await responseBuilder.response?.edit({ embeds: responseBuilder.embeds, components: [] });

                    collector.stop('Property bought');

                    break;
                case 'inspectProperty':
                    const property = getPropertyFromId(square.id);
                    if (!property) throw 'Inspect Property Error';

                    const embed = await buildPropertyEmbed(property);

                    interaction.followUp({ embeds: [embed], content: 'You clicked on \`See Property Details`:' });
                    responseBuilder.actionRow.components[1].setDisabled(true);
                    await responseBuilder.response?.edit({ embeds: responseBuilder.embeds, components: [responseBuilder.actionRow] });

                    break;
                case 'endTurn': default:
                    throw 'Turn Ended';
            }
        } catch {
            markTurnAsEnded();
        }
    });

    function markTurnAsEnded() {
        responseBuilder.embeds[0].setDescription('***TURN ENDED***');
        responseBuilder.response?.edit({ embeds: responseBuilder.embeds, components: [] });
    }
}

async function executeBuy(square: Square, interaction: CommandInteraction, responseBuilder: DiscordResponse) {
    const property = getPropertyFromId(square.id);
    const player = await Player.findOne({ where: { userId: interaction.user.id } });

    await buyProperty(property!, player!);

    responseBuilder.embeds[0].setDescription(`You bought the property \`${square.name}\` for \`${property!.price}$\`.\n
                                                          You now have \`${player!.money}$\` left.`);
}

async function updateTurn(game: Game, playerTurn: Turn): Promise<void> {
    const nextTurn = (game.get('currentTurn') + 1) % game.get('players')!.length;
    await game.update({ currentTurn: nextTurn });
    await playerTurn.update({ hasRolled: false });
}

async function buyProperty(property: Property, player: Player) {
    await (await PropertyGame.findOne({ where: { gameId: player.gameId, id: property.id } }))?.update({ ownerId: player.userId });
    await player.update({ money: player.money - property.price });
}

export { command };

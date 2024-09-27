import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    Interaction,
    SlashCommandBuilder,
} from "discord.js";
import Command from "../../models/interfaces/Command";

// Utility Imports
import { buildBoardEmbed } from "../../utils/buildBoardEmbed";
import { drawBoard } from "../../utils/drawBoard";
import { buildErrorEmbed } from "../../utils/buildErrorEmbedResponse";
import { getGameFromGuildWithStatus } from "../../utils/database";
import { promptJailActionAndCheckIfPlays } from "../../utils/actions/jailTurn";

// Database/Table Imports
import { Player } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";
import { Turn } from "../../db/tables/Turn";
import { Square } from "../../db/tables/Square";
import { rollDices } from "../../utils/actions/rollDices";
import { goToJail } from "../../utils/actions/goToJail";
import { useCard } from "../../utils/actions/cardTurn";
import { buildTemplateEmbed } from "../../utils/buildTemplateEmbed";
import { createPropertyPromptActionRow, getPropertyFromStatic } from "../../utils/actions/propertyTurn";
import { Property } from "../../db/tables/Property";
import Client from "../../models/classes/Client"
import DiscordResponse from "../../models/classes/DiscordResponse";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Rolls the dice!"),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);
            const player = getPlayerOrFail(game, interaction.user.id);
            const playerTurn = await getPlayerTurn(game, player);

            await validateTurn(game, playerTurn);

            const { result1, result2 } = rollDices();

            if (player.get('jailStatus') !== -1) {
                const continuesPlaying = await promptJailActionAndCheckIfPlays(player, interaction, result1, result2);
                if (!continuesPlaying) return;
            }

            const squareNumber = await executePlayerMove(player, playerTurn, result1 + result2);
            const square = await Square.findOne({ where: { id: squareNumber } });

            let responseBuilder = new DiscordResponse();

            const endTurnButton = new ButtonBuilder()
                .setCustomId('endTurn')
                .setLabel('End Turn')
                .setStyle(ButtonStyle.Danger);

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
                responseBuilder = await handleSquareAction(player, square!);
            }

            responseBuilder.actionRow.addComponents(endTurnButton);

            const boardImg = await drawBoard(game.players!);
            
            const response = await interaction.reply({ embeds: responseBuilder.embeds, components: [responseBuilder.actionRow], files: [boardImg], 
                content: `You rolled a \`${result1}\` and a \`${result2}\` 🎲` });

            await concludeTurn(interaction, response, game, playerTurn);
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
};

function hasRolledDoublesThriceInARow(doubles: boolean, player: Player) {
    return doubles && player.get('doubleRollStreak') === 2;
}

async function getCurrentGameOrFail(guildId: string): Promise<Game> {
    const game = await getGameFromGuildWithStatus(guildId, 'active');
    if (!game) throw new Error('There are no **active** games on this server. Create a game with `/newgame`');
    return game;
}

function getPlayerOrFail(game: Game, userId: string): Player {
    const player = game.players?.find((p) => p.userId === userId);
    if (!player) throw new Error(`User is not registered in the current game. Run \`/register\` to join game ${game.get('id')}`);
    return player;
}

async function getPlayerTurn(game: Game, player: Player): Promise<Turn> {
    const playerTurn = await Turn.findOne({ where: { gameId: game.get('id'), userId: player.get('userId') } });
    if (!playerTurn) throw new Error('Unable to find player\'s turn data');
    return playerTurn;
}

async function validateTurn(game: Game, playerTurn: Turn): Promise<void> {
    if (!await isPlayersTurn(game, playerTurn)) throw new Error('It is not your turn');
    if (await playerHasRolled(playerTurn)) throw new Error('You have already rolled. Finish your turn by clicking the `End Turn` button');
}

async function executePlayerMove(player: Player, playerTurn: Turn, squaresMoved: number): Promise<number> {
    const newSquare = (squaresMoved + player.get('current_square')) % 40;

    await player.update({ current_square: newSquare });
    await playerTurn.update({ hasRolled: true });

    return newSquare;
}

async function handleSquareAction(player: Player, square: Square): Promise<DiscordResponse> {
    const responseBuilder = new DiscordResponse();
    const boardEmbed = buildBoardEmbed()
        .setTitle(`You landed on \`${square.name}\``);

    switch (square!.get('type')) {
        case 'small_tax':
            await player.update({ money: player.get('money') - 100 });
            boardEmbed.setDescription('You paid `100$` to the bank');
            break;
        case 'big_tax':
            await player.update({ money: player.get('money') - 200 });
            boardEmbed.setDescription('You paid `200$` to the bank');
            break;
        case 'visit_jail':
            boardEmbed.setDescription('Don\'t worry, you are just visiting');
            break;
        case 'free_space':
            boardEmbed.setDescription('Just take a break.');
            break;
        case 'start':
            await player.update({ money: player.get('money') + 200 });
            boardEmbed.setDescription('You earned `200$` for completing a lap!');
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
            let property = await Property.findOne({ where: { gameId: player.gameId, id: square.id } });

            if (!property) {
                property = getPropertyFromStatic(square);
                boardEmbed.setDescription('What do you want to do?');
                responseBuilder.actionRow.addComponents(createPropertyPromptActionRow());

                break;
            }

            const owner = await Player.findOne({ where: { userId: property.owner, gameId: player.gameId } });
            boardEmbed.setColor(property.color);

            if (player.userId === owner!.userId) {
                boardEmbed.setDescription(`This property is owned by you. Enjoy your stay!`);
            } else {
                boardEmbed.setDescription(`This property is owned by ${Client.getInstance().users.cache.get(property.owner)}.
                    You will need to pay them \`${square.rent}\`$ for rent.`);

                await player.update({ money: player.money - square.rent });
                await owner!.update({ money: owner!.money + square.rent });
            }
            break;
    }

    responseBuilder.embeds.unshift(boardEmbed);

    return responseBuilder;
}

async function concludeTurn(interaction: CommandInteraction, response: any, game: Game, playerTurn: Turn): Promise<void> {
    try {
        const confirmation = await response.awaitMessageComponent({
            filter: (i: Interaction) => i.user.id === interaction.user.id,
            time: 60000,
        });

        if (confirmation.customId === 'endTurn') {
            await confirmation.update({ content: '***TURN ENDED***', components: [] });
        }
    } catch {
        await response.edit({ content: '***TURN ENDED***', components: [] })
    } finally {
        await updateTurn(game, playerTurn);
    }
}

async function updateTurn(game: Game, playerTurn: Turn): Promise<void> {
    const nextTurn = (game.get('currentTurn') + 1) % game.get('players')!.length;
    await game.update({ currentTurn: nextTurn });
    await playerTurn.update({ hasRolled: false });
}

async function isPlayersTurn(game: Game, playerTurn: Turn): Promise<boolean> {
    const currentTurn = game.get('currentTurn');
    return (currentTurn % game.get('players')!.length) === playerTurn.get('playerOrder');
}

async function playerHasRolled(playerTurn: Turn): Promise<boolean> {
    return playerTurn.get('hasRolled');
}

function handleCommandError(interaction: CommandInteraction, error: Error): void {
    if (interaction.replied) {
        interaction.followUp({ ...buildErrorEmbed(interaction, error.message), ephemeral: true });
    } else {
        interaction.reply({ ...buildErrorEmbed(interaction, error.message), ephemeral: true });
    }
}

export { command };

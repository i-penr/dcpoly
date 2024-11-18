import {
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    ComponentType,
    Interaction,
    Message,
    SlashCommandBuilder,
} from "discord.js";
import Command from "../../models/interfaces/Command";
import { buildBoardEmbed } from "../../utils/buildBoardEmbed";
import { drawBoard } from "../../utils/drawBoard";
import { promptJailActionAndCheckIfPlays } from "../../utils/actions/jailTurn";
import { Player } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";
import { Turn } from "../../db/tables/Turn";
import { Square } from "../../db/tables/Square";
import { rollDices } from "../../utils/actions/rollDices";
import { goToJail } from "../../utils/actions/goToJail";
import { useCard } from "../../utils/actions/cardTurn";
import { createPropertyPromptActionRow, getPropertyFromStatic } from "../../utils/actions/propertyTurn";
import { Property } from "../../db/tables/Property";
import Client from "../../models/classes/Client"
import DiscordResponse from "../../models/classes/DiscordResponse";
import { getCurrentGameOrFail, getPlayerOrFail, getPlayerTurn, handleCommandError, validateTurn } from "../../utils/validations";
import { Sequelize } from "sequelize";
import { buildTemplateEmbed } from "../../utils/buildTemplateEmbed";

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
            const square = await Square.findOne({ where: { id: squareNumber } });

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
                responseBuilder = await handleSquareAction(player, square!);
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
            const property = await Property.findOne({ where: { gameId: player.gameId, id: square.id } });
            const owner = await Player.findOne({ where: { userId: property!.owner, gameId: player.gameId } });

            if (!owner) {
                boardEmbed.setDescription(`What do you want to do?\n\n(**Current Money** \`${player.money}$\`)`);
                responseBuilder.actionRow.addComponents(createPropertyPromptActionRow(player.get('money') >= property!.price));
                break;
            }

            boardEmbed.setColor(property!.color);

            if (player.userId === owner.userId) {
                boardEmbed.setDescription(`This property is owned by you. Enjoy your stay!`);
            } else {
                boardEmbed.setDescription(`This property is owned by ${await Client.getInstance().users.fetch(owner.userId)}.\n
                    You will need to pay them \`${square.rent}\`$ for rent.`);

                await player.update({ money: player.money - square.rent });
                await owner!.update({ money: owner!.money + square.rent });
            }
            break;
    }

    responseBuilder.embeds.unshift(boardEmbed);

    return responseBuilder;
}

async function handleButtonInteractions(interaction: CommandInteraction, responseBuilder: DiscordResponse, square: Square): Promise<void> {
    const collector = responseBuilder.response?.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000, 
        filter: (i) => {
            i.deferUpdate();
            return i.user.id === interaction.user.id 
        }})

    collector?.on('collect', async b => {
        try {
            switch (b.customId) {
                case 'buyProperty':
                    await executeBuy(square, interaction, responseBuilder);
                    await responseBuilder.response?.edit({ embeds: responseBuilder.embeds, components: [] });

                    collector.stop('Property bought');

                    break;
                case 'inspectProperty':
                    const property = await Property.findOne({ where: { id: square.id } });
                    if (!property) throw 'Inspect Property Error';

                    const embed = buildTemplateEmbed()
                        .setColor(property.color)
                        .setTitle(square.name)
                        .setDescription(`- **Price**: \`${property.price}\`$\n- **Base rent**: \`${square.rent}\`$\n- **Owned by**: ${property.owner ? await Client.getInstance().users.fetch(property.owner): 'Nobody'}`)
                        .addFields([
                            { name: 'Rent with 1 building', value: 'PLACEHOLDER', inline: true },
                            { name: 'Rent with 2 buildings', value: 'PLACEHOLDER', inline: true },
                            { name: 'Rent with 3 buildings', value: 'PLACEHOLDER', inline: true },
                            { name: 'Rent with 4 buildings', value: 'PLACEHOLDER', inline: true },
                            { name: 'Rent with 1 hotel', value: 'PLACEHOLDER', inline: true },
                        ]);
                        
                    interaction.followUp({ embeds: [embed] });
                    await responseBuilder.response?.edit({ embeds: responseBuilder.embeds });

                    break;
                case 'endTurn': default:
                    throw 'Turn Ended';
            }
        } catch {
            responseBuilder.embeds[0].setDescription('***TURN ENDED***'); 
            await responseBuilder.response?.edit({ embeds: responseBuilder.embeds, components: [] });
        }
    });
}

async function executeBuy(square: Square, interaction: CommandInteraction, responseBuilder: DiscordResponse) {
    const property = await Property.findOne({ where: { id: square.id } });
    const player = await Player.findOne({ where: { userId: interaction.user.id } });

    await buyProperty(interaction, property!, player!);

    responseBuilder.embeds[0].setDescription(`You bought the property \`${square.name}\` for \`${property!.price}$\`.\n
                                                          You now have \`${player!.money}$\` left.`);
}

async function updateTurn(game: Game, playerTurn: Turn): Promise<void> {
    const nextTurn = (game.get('currentTurn') + 1) % game.get('players')!.length;
    await game.update({ currentTurn: nextTurn });
    await playerTurn.update({ hasRolled: false });
}

async function buyProperty(interaction: CommandInteraction, property: Property, player: Player) {
    await property.update({ owner: interaction.user.id }); 
    await player.update({ money: player.money - property.price }); 
}

export { command };

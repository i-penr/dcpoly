import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, Embed, EmbedBuilder, Interaction, SlashCommandBuilder } from "discord.js";
import Command from "../../models/interfaces/Command";

// Utility Imports
import { buildBoardEmbed } from "../../utils/buildBoardEmbed";
import { drawBoard } from "../../utils/drawBoard";
import { buildErrorEmbed } from "../../utils/buildErrorEmbedResponse";
import { getGameFromGuildWithStatus } from "../../utils/database";

// Database/Table Imports
import { Player } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";
import { Turn } from "../../db/tables/Turn";
import { Square } from "../../db/tables/Square";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Rolls the dice!"),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);
            const player = getPlayerOrFail(game, interaction.user.id);

            const playerTurn = await Turn.findOne({ where: { gameId: game.get('id'), userId: player.get('userId') } });

            if (!await isPlayersTurn(game, playerTurn!)) throw new Error('It is not your turn');
            if (await playerHasRolled(playerTurn!)) throw new Error('You have already rolled. Finish your turn by clicking the `End Turn` button');

            const { result1, result2 } = await executePlayersRoll(player, playerTurn!);
            const { boardEmbed, boardImg } = await buildBoard(interaction, game.players!, result1, result2);

            const response = await forgeResponse(interaction, boardEmbed, boardImg);
            const actionEmbed = await performSquareAction(player, interaction);
            interaction.followUp({ embeds: [actionEmbed] });
            await handleTurnEnd(interaction, response, game, boardEmbed, playerTurn!);
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
};

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

async function handleTurnEnd(interaction: CommandInteraction, response: any, game: Game, boardEmbed: EmbedBuilder, playerTurn: Turn) {
    try {
        const confirmation = await response.awaitMessageComponent({ filter: (i: Interaction) => i.user.id === interaction.user.id, time: 60000 });

        if (confirmation.customId === 'endTurn') {
            await updateTurn(game, playerTurn);
            await confirmation.update({ content: 'Turn ended', components: [] });
        }
    } catch (e) {
        await updateTurn(game, playerTurn);
    } finally {
        await interaction.editReply({ embeds: [boardEmbed.setTitle('Turn Ended')], components: [] });
    }
}

async function updateTurn(game: Game, playerTurn: Turn): Promise<void> {
    await game.update({ currentTurn: (game.get('currentTurn') + 1) });
    await playerTurn.update({ hasRolled: false });
}

async function performSquareAction(player: Player, interaction: CommandInteraction) {
    const square = await Square.findOne({ where: { id: player.get('current_square') } });
    let actionEmbed = buildBoardEmbed(interaction).setTitle(`You landed on ${square?.get('name')}`)

    switch (square?.get('type')) {
        case 'small_tax':
            await player.update({ money: player.get('money') - 100 });
            actionEmbed.setDescription('You paid `100$` to the bank');
            break;
        case 'big_tax':
            await player.update({ money: player.get('money') - 200 });
            actionEmbed.setDescription('You paid `200$` to the bank');
            break;
        case 'visit_jail':
            actionEmbed.setDescription('Don\'t worry, you are just visiting');
            break;
        case 'free_space':
            actionEmbed.setDescription('Just take a break.');
            break;
        case 'start':
            await player.update({ money: player.get('money') + 200 });
            actionEmbed.setDescription('You earned `200$` for completing a lap!');
            break;
        case 'jail':
            await player.update({ current_square: 10 });
            // TODO: add jail effect
            actionEmbed.setDescription('You are going to jail for the next 3 turns. You can get out of jail by paying `50$`, rolling doubles or using a `Get out of Jail Card`');
            break;
    }

    return actionEmbed;
}

async function forgeResponse(interaction: CommandInteraction, boardEmbed: EmbedBuilder, boardImg: AttachmentBuilder) {
    const endTurnButton = new ButtonBuilder()
        .setCustomId('endTurn')
        .setLabel('End Turn')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(endTurnButton);

    return await interaction.reply({ embeds: [boardEmbed], files: [boardImg], components: [row] });
}

async function executePlayersRoll(player: Player, playerTurn: Turn) {
    const result1 = rollDice();
    const result2 = rollDice();

    await player.update({ current_square: (result1 + result2 + player.get('current_square')) % 40 });
    await playerTurn.update({ hasRolled: true });

    return { result1, result2 };
}

function rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
}

async function buildBoard(interaction: CommandInteraction, players: Player[], result1: number, result2: number) {
    const boardImg = await drawBoard(interaction, players);

    const boardEmbed = buildBoardEmbed(interaction)
        .setAuthor({ name: `${interaction.user.displayName}'s turn`, iconURL: interaction.user.avatarURL()! })
        .setTitle(`${interaction.user.username} rolled a **${result1}** and a **${result2}**`);

    return { boardEmbed, boardImg };
}

async function isPlayersTurn(game: Game, playerTurn: Turn): Promise<boolean> {
    const currentTurn = game.get('currentTurn');

    return (currentTurn % game.get('players')!.length) === playerTurn?.get('playerOrder');
}

async function playerHasRolled(playerTurn: Turn) {
    return playerTurn.get('hasRolled');
}

function handleCommandError(interaction: CommandInteraction, error: Error): void {
    interaction.reply({ ...buildErrorEmbed(interaction, error.message), ephemeral: true });
}

export { command };

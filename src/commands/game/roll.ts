import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, Interaction, SlashCommandBuilder } from "discord.js";
import Command from "../../models/interfaces/Command";

// Utility Imports
import { buildBoardEmbed } from "../../utils/buildBoardEmbed";
import { drawBoard } from "../../utils/drawBoard";
import { buildErrorEmbed } from "../../utils/buildErrorEmbedResponse";
import { getCurrentActiveGame } from "../../utils/database";

// Database/Table Imports
import { Player } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";
import { Turn } from "../../db/tables/Turn";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Rolls the dice!"),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);
            const player = getPlayerOrFail(game, interaction.user.id);
            await validatePlayersTurn(game, player);

            const { result1, result2 } = await executePlayersRoll(player);
            const { boardEmbed, boardImg } = await buildBoard(interaction, game.players!, result1, result2);

            const response = await forgeResponse(interaction, boardEmbed, boardImg);
            await handleTurnEnd(interaction, response, game, boardEmbed, boardImg);
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
};

async function getCurrentGameOrFail(guildId: string): Promise<Game> {
    const game = await getCurrentActiveGame(guildId);
    if (!game) throw new Error('There are no **active** games on this server. Create a game with `/newgame`');
    return game;
}

function getPlayerOrFail(game: Game, userId: string): Player {
    const player = game.players?.find((p) => p.userId === userId);
    if (!player) throw new Error(`User is not registered in the current game. Run \`/register\` to join game ${game.get('id')}`);
    return player;
}

async function validatePlayersTurn(game: Game, player: Player): Promise<void> {
    const isTurn = await isPlayersTurn(game, player);
    if (!isTurn) throw new Error('It is not your turn');
}

async function handleTurnEnd(interaction: CommandInteraction, response: any, game: Game, boardEmbed: EmbedBuilder, boardImg: AttachmentBuilder) {
    try {
        const confirmation = await response.awaitMessageComponent({ filter: (i: Interaction) => i.user.id === interaction.user.id, time: 60000 });

        if (confirmation.customId === 'endTurn') {
            await updateTurn(game);
            await confirmation.update({ content: 'Turn ended', components: [] });
        }
    } catch (e) {
        await updateTurn(game);
    } finally {
        await interaction.editReply({ embeds: [boardEmbed.setTitle('Turn Ended')], files: [boardImg], components: [] });
    }
}

async function updateTurn(game: Game): Promise<void> {
    await game.update({ currentTurn: (game.get('currentTurn') + 1) % game.get('players')!.length });
}

async function forgeResponse(interaction: CommandInteraction, boardEmbed: EmbedBuilder, boardImg: AttachmentBuilder) {
    const endTurnButton = new ButtonBuilder()
        .setCustomId('endTurn')
        .setLabel('End Turn')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(endTurnButton);

    return await interaction.reply({ embeds: [boardEmbed], files: [boardImg], components: [row] });
}

async function executePlayersRoll(player: Player) {
    const result1 = rollDice();
    const result2 = rollDice();

    await player.update({ current_square: (result1 + result2 + (player.get('current_square') as number)) % 40 });
    return { result1, result2 };
}

function rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
}

async function buildBoard(interaction: CommandInteraction, players: Player[], result1: number, result2: number) {
    const boardImg = await drawBoard(interaction, players);

    const boardEmbed = buildBoardEmbed(interaction)
        .setTitle(`${interaction.user.username}'s turn`)
        .setDescription(`${interaction.user.username} rolled a **${result1}** and a **${result2}**`);
    return { boardEmbed, boardImg };
}

async function isPlayersTurn(game: Game, player: Player): Promise<boolean> {
    const currentTurn = game.get('currentTurn');
    const playerTurn = await Turn.findOne({ where: { gameId: game.get('id'), userId: player.get('userId') } });

    return currentTurn === playerTurn?.get('playerOrder');
}

function handleCommandError(interaction: CommandInteraction, error: Error): void {
    interaction.reply({ ...buildErrorEmbed(interaction, error.message), ephemeral: true });
}

export { command };

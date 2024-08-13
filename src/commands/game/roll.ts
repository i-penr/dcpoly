import { CommandInteraction, SlashCommandBuilder } from "discord.js";
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
            const game = await getCurrentActiveGame(interaction.guildId!);

            if (!game) {
                throw new Error('There are no **active** games on this server. Create a game with `/newgame`')
            }

            const player = game.players?.find((p) => p.userId === interaction.user.id);

            if (!player) {
                throw new Error(`User ${interaction.user} is not registered in the current game. Run \`/register\` to join game ${game.get('id')}`);
            }

            if (!await isPlayersTurn(game, player)) {
                throw new Error(`It is not your turn`);
            }

            await game.update({ currentTurn: (game.get('currentTurn') + 1) % game.get('players')!.length });

            const { result1, result2 } = await executePlayersRoll(player);
            const { boardEmbed, boardImg } = await buildBoard(interaction, game.players!, result1, result2);

            interaction.reply({ embeds: [boardEmbed], files: [boardImg] });

        } catch (error: any) {
            interaction.reply({ ...buildErrorEmbed(interaction, error.message), ephemeral: true })
        }
    },
};


async function executePlayersRoll(player: Player) {
    const result1 = Math.floor(Math.random() * 6) + 1;
    const result2 = Math.floor(Math.random() * 6) + 1;

    await player.update({ current_square: (result1 + result2 + (player.get('current_square') as number)) % 40 });
    return { result1, result2 };
}

async function buildBoard(interaction: CommandInteraction, players: Player[], result1: number, result2: number) {
    const boardImg = await drawBoard(interaction, players);

    const boardEmbed = buildBoardEmbed(interaction)
        .setTitle(`${interaction.user.username}'s roll`)
        .setDescription(`You rolled a **${result1}** and a **${result2}**`);
    return { boardEmbed, boardImg };
}

async function isPlayersTurn(game: Game, player: Player) {
    const currentTurn = game.get('currentTurn');
    const playerTurnId = await Turn.findOne({ where: { gameId: game.get('id'), userId: player.get('userId') } });

    return currentTurn === playerTurnId?.get('playerOrder');
}

export { command };

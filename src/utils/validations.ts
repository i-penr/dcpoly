import { CommandInteraction } from "discord.js";
import { Game } from "../db/tables/Game";
import { Player } from "../db/tables/Player";
import { Turn } from "../db/tables/Turn";
import { buildErrorEmbed } from "./embeds/buildErrorEmbedResponse";
import { getGameFromGuildWithStatus } from "./database";

export async function getCurrentGameOrFail(guildId: string): Promise<Game> {
    const game = await getGameFromGuildWithStatus(guildId, 'active');
    if (!game) throw new Error('There are no **active** games on this server. Create a game with `/newgame`');
    return game;
}

export function getPlayerOrFail(game: Game, userId: string): Player {
    const player = game.players?.find((p) => p.userId === userId);
    if (!player) throw new Error(`User is not registered in the current game. No players can register, since the game has already started.`);
    return player;
}

export async function getPlayerTurn(game: Game, player: Player): Promise<Turn> {
    const playerTurn = await Turn.findOne({ where: { gameId: game.get('id'), userId: player.get('userId') } });
    if (!playerTurn) throw new Error('Unable to find player\'s turn data');
    return playerTurn;
}

export async function validateTurn(game: Game, playerTurn: Turn): Promise<void> {
    if (!await isPlayersTurn(game, playerTurn)) throw new Error('It is not your turn');
    if (await playerHasRolled(playerTurn)) throw new Error('You have already rolled. Finish your turn by clicking the `End Turn` button');
}

export function handleCommandError(interaction: CommandInteraction, error: Error): void {
    if (interaction.replied || interaction.deferred) {
        interaction.followUp({ ...buildErrorEmbed(interaction, error.message), ephemeral: true });
    } else {
        interaction.reply({ ...buildErrorEmbed(interaction, error.message), ephemeral: true })
    }
}

async function isPlayersTurn(game: Game, playerTurn: Turn): Promise<boolean> {
    const currentTurn = game.get('currentTurn');
    return (currentTurn % game.get('players')!.length) === playerTurn.get('playerOrder');
}

async function playerHasRolled(playerTurn: Turn): Promise<boolean> {
    return playerTurn.get('hasRolled');
}
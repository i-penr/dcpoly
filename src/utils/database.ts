import { Game } from "../db/tables/Game";
import { Player } from "../db/tables/Player";

export async function getCurrentActiveGame(guild_id: string) {
    try {
        return await Game.findOne({
            where: {
                guild_id: guild_id,
                status: 'active'
            }
        });
    } catch (err: any) {
        console.error(err.message);
        return null;
    }
}

export async function getPlayersInGame(gameId: number) {
    return await Player.findAll({
        where: { gameId: gameId }
    });
}
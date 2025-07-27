import { Game } from "../db/tables/Game";
import { Player } from "../db/tables/Player";

export async function getGameFromGuildWithStatus(guild_id: string, status: string) {
    try {
        return await Game.findOne({
            where: {
                guild_id: guild_id,
                status: status
            },
            include: {
                model: Player
            }
        });
    } catch (err: unknown) {
        console.error((err as Error).message);
        return null;
    }
}
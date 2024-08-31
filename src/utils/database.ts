import { Game } from "../db/tables/Game";
import { Player } from "../db/tables/Player";

export async function getGameFromGuildWithStatus(guild_id: string, status: any) {
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
    } catch (err: any) {
        console.error(err.message);
        return null;
    }
}
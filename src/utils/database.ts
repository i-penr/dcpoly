import { Game } from "../db/tables/Game";

export async function getCurrentActiveGame(guild_id: string | null) {
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
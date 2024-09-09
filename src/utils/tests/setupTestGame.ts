import { User } from "../../db/tables/User";
import { Game } from "../../db/tables/Game";
import { Player } from "../../db/tables/Player";
import { Turn } from "../../db/tables/Turn";

export async function setupTestGame() {
    await Game.create({ id: 1, guild_id: '338791508214022144', status: 'active' });
    await User.bulkCreate([
        {
            id: '220525113404030987'
        },
        {
            id: '540270864143220805'
        }
    ]);
    await Player.create({ gameId: 1, userId: '220525113404030987', jailStatus: -1, doubleRollStreak: 1 });
    await Player.create({ gameId: 1, userId: '540270864143220805' });
    await Turn.bulkCreate([{
        playerOrder: 0,
        gameId: 1,
        userId: '220525113404030987'
    },
    {
        playerOrder: 1,
        gameId: 1,
        userId: '540270864143220805'
    }
    ]);
}
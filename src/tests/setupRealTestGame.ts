import { User } from "../db/tables/User";
import { Game } from "../db/tables/Game";
import { Player } from "../db/tables/Player";
import { Turn } from "../db/tables/Turn";
import { PropertyGame } from "../db/tables/PropertyGame";
import { getProperties } from "../utils/actions/propertyActions";

/**
 * This is just for me to test with actual values in Discord, so I don't have to create the game and add the players every time.
 */

export async function setupTestGame() {
    await Game.create({ id: 1, guild_id: '338791508214022144', status: 'active' });
    await User.bulkCreate([
        { id: '220525113404030987' },
        { id: '540270864143220805' }
    ]);
    await Player.bulkCreate([
        { gameId: 1, userId: '220525113404030987' },
        { gameId: 1, userId: '540270864143220805' }
    ]);
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
    const properties = getProperties();

    PropertyGame.create({ id: properties.pop()!.id, ownerId: '220525113404030987', gameId: 1 })
    PropertyGame.create({ id: properties.pop()!.id, ownerId: '220525113404030987', gameId: 1 })

    properties.forEach(({ id }: { id: number }) => {
        PropertyGame.create({ id: id, gameId: 1 });
    });
}
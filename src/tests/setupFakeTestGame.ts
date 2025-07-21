import { User } from "../db/tables/User";
import { Game } from "../db/tables/Game";
import { Player } from "../db/tables/Player";
import { Turn } from "../db/tables/Turn";
import { getProperties } from "../utils/actions/propertyActions";
import { PropertyGame } from "../db/tables/PropertyGame";

/**
 * This is for the bun/jest tests.
 */

export async function setupFakeTestGame() {
    // The first user will act as the message author
    const authorId: string = process.env.AUTHOR_ID!;
    const secondId: string = process.env.SECOND_ID!;
    const gameId: number = parseInt(process.env.GAME_ID!);

    await Game.create({ id: gameId, guild_id: 'guildId', status: 'active' });
    await User.bulkCreate([
        { id: authorId },
        { id: secondId }
    ]);
    await Player.bulkCreate([
        { gameId: gameId, userId: authorId },
        { gameId: gameId, userId: secondId }
    ]);
    await Turn.bulkCreate([{
        playerOrder: 0,
        gameId: gameId,
        userId: authorId
    },
    {
        playerOrder: 1,
        gameId: gameId,
        userId: secondId
    }
    ]);

    const properties = getProperties();

    properties.forEach(({ id }: { id: number }) => {
        PropertyGame.create({ id: id, gameId: 1 });
    });
}
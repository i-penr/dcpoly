import { User } from "../db/tables/User";
import { Game } from "../db/tables/Game";
import { Player } from "../db/tables/Player";
import { Turn } from "../db/tables/Turn";
import { Property } from "../db/tables/Property";
import { getProperties } from "../utils/actions/propertyTurn";
import { Square } from "../db/tables/Square";
import path from "node:path";
import fs from 'node:fs';

/**
 * This is for the bun/jest tests.
 */

export async function setupFakeTestGame() {
    // The first user will act as the message author
    const authorId: string = process.env.AUTHOR_ID!;
    const secondId: string = process.env.SECOND_ID!;
    const gameId: number = parseInt(process.env.GAME_ID!);

    await Square.bulkCreate(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'squares.json'), 'utf-8')));
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
    properties.map((p: any) => { p.gameId = gameId });
    await Property.bulkCreate(properties);
}
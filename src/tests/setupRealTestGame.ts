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
 * This is just for me to test with actual values in Discord, so I don't have to create the game and add the players every time.
 */

export async function setupTestGame() {
    await Square.bulkCreate(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'squares.json'), 'utf-8')));
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
    properties.map((p: any) => { p.gameId = 1 });
    await Property.bulkCreate(properties);
}
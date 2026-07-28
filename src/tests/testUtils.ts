import { PropertyGame } from "../db/tables/PropertyGame";

export async function authorOwnsAllBrownProperties() {
  (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({
    ownerId: process.env.AUTHOR_ID,
  });
  (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 3 } }))?.update({
    ownerId: process.env.AUTHOR_ID,
  });
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from "bun:test";
import { mockDb } from "../mockDb";
import { mockInteractionAndSpyReply } from "../mockDiscord";
import { Player } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";
import type { Sequelize } from "sequelize";

describe('/startgame command tests', () => {
    let spy: any, sequelize: Sequelize;

    beforeEach(async () => {
        sequelize = await mockDb();
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });
    });

    it('should error (game null)', async () => {
        await sequelize.truncate();

        spy = await mockInteractionAndSpyReply('startgame');
        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0].data.description).toBe('There are no games with the status `new` on the server. Create a new game with `/newgame`')
    });

    it('should error (no new games)', async () => {
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'finished' });
    
        spy = await mockInteractionAndSpyReply('startgame');
        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0].data.description).toBe('There are no games with the status `new` on the server. Create a new game with `/newgame`')
    });

    it('should error (not enough players)', async () => {
        (await Player.findOne({ where: { userId: process.env.AUTHOR_ID, gameId: process.env.GAME_ID }}))?.destroy();

        spy = await mockInteractionAndSpyReply('startgame');
        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0].data.description).toBe(`There are not enough players in game **#${process.env.GAME_ID}** to start!`);
    });

    it('should start the game', async () => {
        spy = await mockInteractionAndSpyReply('startgame');
        const reply = spy.mock.calls[0][0];

        expect(reply).toBe(`Game #${process.env.GAME_ID} has now started!`);
    });
});

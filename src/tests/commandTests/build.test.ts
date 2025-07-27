/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, test } from "bun:test";
import { mockDb } from "../mockDb";
import { Game } from "../../db/tables/Game";
import { mockInteractionAndSpyReply } from "../mockDiscord";
import { PropertyGame } from "../../db/tables/PropertyGame";
import type { Sequelize } from "sequelize";

describe('/build command tests', async () => {
    let spy: any, sequelize: Sequelize;

    beforeEach(async () => {
        sequelize = await mockDb();
    });

    it('should throw error message, game null', async () => {
        await sequelize.truncate();
        spy = await mockInteractionAndSpyReply('build');

        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe('There are no **active** games on this server. Create a game with `/newgame`');
    });

    it('should error (no active games in server)', async () => {
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

        spy = await mockInteractionAndSpyReply('build');

        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe('There are no **active** games on this server. Create a game with `/newgame`');
    });

    it('should error (user does not own selected property)', async () => {
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.SECOND_ID });

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as any);
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toMatch(/Sorry! You don't own property `([^`]+)` in the current game \(game #\d+\)/);
    });

    it('should error (user owns property, but not the whole color)', async () => {
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.AUTHOR_ID });

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as any);
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toMatch(/You cannot build in color ([^.]+). You need to \*\*own all properties in that color\*\* first!/);
    });

    it('should show buy prompt', async () => {
        // Author owns all Brown properties
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.AUTHOR_ID });
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 3 } }))?.update({ ownerId: process.env.AUTHOR_ID });

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as any);
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.title).toMatch(/Build operation summary in `([^`]+)`/);
    });

    test.todo('should cancel the operation (user selected \'No\')', async () => {
        // Author owns all Brown properties
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.AUTHOR_ID });
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 3 } }))?.update({ ownerId: process.env.AUTHOR_ID });

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as any);
    });

    test.todo('should cancel the operation (prompt timeout)', async () => {
        // Author owns all Brown properties
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.AUTHOR_ID });
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 3 } }))?.update({ ownerId: process.env.AUTHOR_ID });

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as any);
    });

    test.todo('should error (user does not have enough money to build)', async () => {
        // Author owns all Brown properties
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.AUTHOR_ID });
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 3 } }))?.update({ ownerId: process.env.AUTHOR_ID });

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as any);
    });

    test.todo('should add a building to property and remove money from user', async () => {
       // Author owns all Brown properties
       (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.AUTHOR_ID });
       (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 3 } }))?.update({ ownerId: process.env.AUTHOR_ID });

       spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as any);
    });
});
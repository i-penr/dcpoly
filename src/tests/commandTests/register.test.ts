/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from "bun:test";
import { mockDb } from "../mockDb";
import { mockInteractionAndSpyReply } from "../mockDiscord";
import { Game } from "../../db/tables/Game";
import { Player } from "../../db/tables/Player";
import { User } from "../../db/tables/User";

describe('/property command tests', async () => {
    let spy: any, sequelize: any;

    beforeEach(async () => {
        sequelize = await mockDb();
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });
    });

    it('should error (game active)', async () => {
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'active' });
        spy = await mockInteractionAndSpyReply('register');
        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0].data.description).toBe('There aren\'t any games waiting on this server.');
    });

    it('should error (no new games waiting)', async () => {
        await sequelize.truncate();
        spy = await mockInteractionAndSpyReply('register');
        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0].data.description).toBe('There aren\'t any games waiting on this server.');
    });

    it('should error (player already in game)', async () => {
        spy = await mockInteractionAndSpyReply('register');
        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0].data.description).toBe('You are already registered in the current game.');
    });

    it('should error (maximum amount of players reached)', async () => {
        await Player.destroy({ where: { userId: process.env.AUTHOR_ID, gameId: process.env.GAME_ID }});
        await User.bulkCreate([
            { id: '11111111111111111112' },
            { id: '11111111111111111113' },
            { id: '11111111111111111114' },
            { id: '11111111111111111115' },
            { id: '11111111111111111116' },
            { id: '11111111111111111117' },
            { id: '11111111111111111118' }
        ]);
        await Player.bulkCreate([
            { gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111112' },
            { gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111113' },
            { gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111114' },
            { gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111115' },
            { gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111116' },
            { gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111117' },
            { gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111118' }
        ]);

        spy = await mockInteractionAndSpyReply('register');
        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0].data.description).toBe('The game has reached its maximum amount of players (8). Run `/startgame` to start.');
    });

    it('should add the existing player to the game', async () => {
        await Player.destroy({ where: { userId: process.env.AUTHOR_ID, gameId: process.env.GAME_ID }});
        spy = await mockInteractionAndSpyReply('register');
        const reply = spy.mock.calls[0][0];

        expect(reply).toMatch(/User .* added successfully to the game./);
        expect(await Player.findOne({ where: { gameId: process.env.GAME_ID, userId: process.env.AUTHOR_ID }})).toBeDefined();
    });

    it('should create the user and add it to the game', async () => {
        await Player.destroy({ where: { userId: process.env.AUTHOR_ID, gameId: process.env.GAME_ID }});
        await User.destroy({ where: { id: process.env.AUTHOR_ID }});

        spy = await mockInteractionAndSpyReply('register');
        const reply = spy.mock.calls[0][0];

        expect(reply).toMatch(/User .* added successfully to the game./);
        expect(await Player.findOne({ where: { gameId: process.env.GAME_ID, userId: process.env.AUTHOR_ID }})).toBeDefined();
    });
});
import { beforeEach, describe, expect, it } from "bun:test";
import { mockDb } from "../mockDb";
import { Game } from "../../db/tables/Game";
import { mockInteractionAndSpyReply } from "../mockDiscord";
import { PropertyGame } from "../../db/tables/PropertyGame";

describe('/build command tests', async () => {
    let spy: any, sequelize: any;

    beforeEach(async () => {
        sequelize = await mockDb();
    });

    it('should throw error message, game null', async () => {
        await sequelize.truncate();
        spy = await mockInteractionAndSpyReply('board');

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

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 });
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toMatch(/Sorry! You don't own property `([^`]+)` in the current game \(game #\d+\)/);
    });

    it('should error (user owns property, but not the whole color)', async () => {
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.AUTHOR_ID });

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 });
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toMatch(/You cannot build in color ([^\.]+). You need to \*\*own all properties in that color\*\* first!/);
    });

    it('should show buy prompt', async () => {
        // Author owns all Brown properties
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.AUTHOR_ID });
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 3 } }))?.update({ ownerId: process.env.AUTHOR_ID });

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 });
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.title).toMatch(/Building summary in \`([^`]+)\`/);
    });

    it('should cancel the operation (user selected \'No\')', async () => {
        // Author owns all Brown properties
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({ ownerId: process.env.AUTHOR_ID });
        (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 3 } }))?.update({ ownerId: process.env.AUTHOR_ID });

        spy = await mockInteractionAndSpyReply('build', { getInteger: () => 1 });
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe(`There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`);
    });

    it('should cancel the operation (prompt timeout)', async () => {
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

        spy = await mockInteractionAndSpyReply('newgame');
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe(`There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`);
    });

    it('should error (user does not have enough money to build)', async () => {
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

        spy = await mockInteractionAndSpyReply('newgame');
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe(`There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`);
    });

    it('should add a building to property and remove money from user', async () => {
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

        spy = await mockInteractionAndSpyReply('newgame');
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe(`There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`);
    });
});
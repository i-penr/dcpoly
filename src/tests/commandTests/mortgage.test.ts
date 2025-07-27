/* import { beforeEach, describe, expect, it } from "bun:test";
import { mockDb } from "../mockDb";
import { Game } from "../../db/tables/Game";
import { mockInteractionAndSpyReply } from "../mockDiscord";

describe('/mortgage command tests', async () => {
    let spy: any, sequelize: any;

    beforeEach(async () => {
        sequelize = await mockDb();
    });

    it('should error (no active games in server)', async () => {
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

        spy = await mockInteractionAndSpyReply('newgame');

        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe(`There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`);
    });

    it('should error (user does not own selected property)', async () => {
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

        spy = await mockInteractionAndSpyReply('newgame');
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe(`There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`);
    });

    it('should error (user does not own the whole color)', async () => {
        (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

        spy = await mockInteractionAndSpyReply('newgame');
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe(`There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`);
    });

    it('should cancel the operation (user selected \'No\')', async () => {
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
}); */

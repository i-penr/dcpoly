import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mockInteractionAndSpyReply } from "./mockDiscord";
import { sequelize as baseSequelize } from "../db/db";
import { setupDatabaseAssociations } from "../db/db_creation/db_creation";
import { setupTestGame } from "./setupTestGame";
import { Game } from "../db/tables/Game";
import { Player } from "../db/tables/Player";

describe('/board command tests', () => {
    let spy: any, sequelize: any;

    beforeEach(async () => {
        sequelize = Object.assign(baseSequelize);
        //sequelize.options.logging = console.log;
        sequelize.options.storage = ':memory:';

        await sequelize.sync({ force: true });
        setupDatabaseAssociations();
        await setupTestGame();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should throw error message, game null', async () => {
        await sequelize.truncate();
        spy = await mockInteractionAndSpyReply('board');

        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe('There are no **active** games on this server. Create a game with `/newgame`');
    });

    it('should return the current game\'s board', async () => {
        spy = await mockInteractionAndSpyReply('board');
        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0].data.title).toMatch(/.*\'s board - Game #.*/);
    });

    it('should have all the players included in the description', async () => {
        spy = await mockInteractionAndSpyReply('board');
        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0].data.description.match(/-/g).length).toBe((await Player.findAll()).length);
    })

    it('should throw error message, game not in active state', async () => {
        await (await Game.findByPk(1))?.update({ status: 'new' });
        
        spy = await mockInteractionAndSpyReply('board');

        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe('There are no **active** games on this server. Create a game with `/newgame`');
    });

});

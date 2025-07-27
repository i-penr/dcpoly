/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from "bun:test";
import { mockDb } from "../mockDb";
import { mockInteractionAndSpyReply } from "../mockDiscord";
import { Player } from "../../db/tables/Player";
import { mockUser } from "../mockUser";

describe('/info command tests', () => {
    let spy: any, sequelize: any;

    beforeEach(async () => {
        sequelize = await mockDb();
    });

    it('should error (null)', async () => {
        await sequelize.truncate();
        spy = await mockInteractionAndSpyReply('info');

        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe('There are no **active** games on this server. Create a game with `/newgame`');
    });

    it('should error (player not in game)', async () => {
        await Player.truncate();
        const user = mockUser({ username: 'testUser', id: process.env.SECOND_ID! })
        spy = await mockInteractionAndSpyReply('info', { getUser: () => user } as any);

        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe(`User <@${user.id}> is not a player in the game.`);
    });

    it('should return specific player\'s info', async () => {
        const userId = process.env.SECOND_ID;
        const selectedDiscordUser = mockUser({ username: 'testUser', id: userId! });
        const player = await Player.findOne({ where: { userId: userId } });
        if (!player) throw 'Error with test data';

        spy = await mockInteractionAndSpyReply('info', { getUser: () => selectedDiscordUser } as any);

        const reply = spy.mock.calls[0][0];
        const attributes = reply.embeds[0].data.fields.reduce((acc: any, item: any) => {
            acc[item.name] = item.value;

            return acc;
        }, {});

        expect(['1st', '2nd', '3rd', '4th', '5th', '6th']).toContain(attributes['Game Ranking']);
        expect(attributes['Money']).toInclude(player.money.toLocaleString());
        expect(attributes['Current Square']).toBe(player.current_square.toString());
        expect(attributes['"Get Out of Jail Free" Cards']).toBe(player.jailFreeCards.toString());
    });

    it('should return message member\'s info', async () => {
        spy = await mockInteractionAndSpyReply('info', { getUser: () => null } as any);

        const reply = spy.mock.calls[0][0];

        // We already check if the data shown is actually the desired data in the previous test, so we will just check if it exists
        expect(reply.embeds[0].data.fields.length).toBeGreaterThan(0);
    });
});

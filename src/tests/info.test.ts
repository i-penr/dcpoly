import { beforeEach, describe, expect, it } from "bun:test";
import { mockDb } from "./mockDb";
import { mockInteractionAndSpyReply } from "./mockDiscord";
import { Player } from "../db/tables/Player";
import { mockUser } from "./mockUser";

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
        const user = mockUser({ username: 'testUser', id: '220525113404030987' })
        spy = await mockInteractionAndSpyReply('info', { getUser: () => user });
        
        const reply = spy.mock.calls[0][0];
        expect(reply.embeds[0].data.description).toBe(`User <@${user.id}> is not a player in the game.`);
    });

    it('should return player\'s info', async () => {
        // Probably should change this very real id...
        const userId = '220525113404030987';
        const discordUser = mockUser({ username: 'testUser', id: userId });
        const player = await Player.findOne({ where: { userId: userId } });
        if (!player) throw 'Error with test data';

        spy = await mockInteractionAndSpyReply('info', { getUser: () => discordUser });

        const reply = spy.mock.calls[0][0];
        const attributes = reply.embeds[0].data.fields.reduce((acc: any, item: any) => {
            acc[item.name] = item.value;

            return acc;
        }, {});

        expect(['1st', '2nd', '3rd', '4th', '5th', '6th']).toContain(attributes['Game Ranking']);
        expect(attributes['Money']).toInclude(player.money.toLocaleString());
        expect(attributes['Current Square']).toBe(player.current_square.toString());
        expect(attributes['\"Get Out of Jail Free\" Cards']).toBe(player.jailFreeCards.toString());
    })
});

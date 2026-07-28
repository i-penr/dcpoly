import { beforeEach, describe, expect, it } from 'bun:test';
import { mockInteractionAndSpyReply } from '../mockDiscord';
import { Game } from '../../db/tables/Game';
import { Player } from '../../db/tables/Player';
import { mockDb } from '../mockDb';
import type { Sequelize } from 'sequelize';
import type { Message } from 'discord.js';

describe('/board command tests', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = await mockDb();
  });


  it('should throw error message, game null', async () => {
    await sequelize.truncate();

    const { spyReply } = await mockInteractionAndSpyReply('board');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe(
      'There are no **active** games on this server. Create a game with `/newgame`',
    );
  });

  it('should throw error message, game not in active state', async () => {
    await (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

    const { spyReply } = await mockInteractionAndSpyReply('board');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe(
      'There are no **active** games on this server. Create a game with `/newgame`',
    );
  });


  it("should return the current game's board", async () => {
    const { spyReply } = await mockInteractionAndSpyReply('board');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.title).toMatch(/.*'s board - Game #.*/);
    expect((reply.embeds[0]!.data.image)).toBeDefined();
  });

  it('should have all the players included in the description', async () => {
    const { spyReply } = await mockInteractionAndSpyReply('board');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description!.match(/-/g)!.length!).toBe(
      (await Player.findAll()).length,
    );
  });

});

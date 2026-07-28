import { beforeEach, describe, expect, it } from 'bun:test';
import { mockDb } from '../mockDb';
import { Game } from '../../db/tables/Game';
import { mockInteractionAndSpyReply } from '../mockDiscord';
import type { Sequelize } from 'sequelize';
import type { Message } from 'discord.js';

describe('/newgame command tests', async () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = await mockDb();
  });

  
  it('should error (active game exists in server)', async () => {
    const { spyReply } = await mockInteractionAndSpyReply('newgame');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe(
      `There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`,
    );
  });


  it('should error (newly created game exists in server)', async () => {
    (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

    const { spyReply } = await mockInteractionAndSpyReply('newgame');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe(
      `There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`,
    );
  });


  it('should create a new game successfully', async () => {
    await sequelize.truncate();

    const { spyReply } = await mockInteractionAndSpyReply('newgame');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply).toMatch(/New game #.* created sucessfully./);
  });
});

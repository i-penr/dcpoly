import { beforeEach, describe, expect, it } from 'bun:test';
import type { Sequelize } from 'sequelize';
import { mockDb } from '../mockDb';
import { mockInteractionAndSpyReply } from '../mockDiscord';
import type { CommandInteractionOptionResolver, Message } from 'discord.js';

describe('/property command tests', async () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = await mockDb();
  });


  it('should error, provided id does not match any property id', async () => {
    await sequelize.truncate();

    const { spyReply } = await mockInteractionAndSpyReply('property', { getInteger: () => 2 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe(
      "undefined is not an object (evaluating 'property.color')",
    );
  });

  
  it('no game, should show property data, without game-related stuff', async () => {
    await sequelize.truncate();

    const { spyReply } = await mockInteractionAndSpyReply('property', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.title).toBe('Brown 1');
  });


  it('game active, should show property data, with game-related stuff', async () => {
    const { spyReply } = await mockInteractionAndSpyReply('property', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.title).toBe('Brown 1');
    expect(reply.embeds[0]!.data.description).toInclude('Owned By');
  });
});

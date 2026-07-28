import { beforeEach, describe, expect, it, jest, spyOn } from 'bun:test';
import { mockDb } from '../mockDb';
import { Game } from '../../db/tables/Game';
import { mockInteractionAndSpyReply } from '../mockDiscord';
import { PropertyGame } from '../../db/tables/PropertyGame';
import type { Sequelize } from 'sequelize';
import * as actualOwnedPropertyOps from '../../utils/ownedPropertyOperations';
import { CommandInteractionOptionResolver, type Message } from 'discord.js';
import { Player } from '../../db/tables/Player';
import { authorOwnsAllBrownProperties } from '../testUtils';

describe('/build command tests', async () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = await mockDb();
  });


  it('should throw error message, game null', async () => {
    await sequelize.truncate();

    const { spyReply } = await mockInteractionAndSpyReply('build');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe(
      'There are no **active** games on this server. Create a game with `/newgame`'
    );
  });


  it('should error (no active games in server)', async () => {
    (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

    const { spyReply } = await mockInteractionAndSpyReply('build');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe(
      'There are no **active** games on this server. Create a game with `/newgame`',
    );
  });


  it('should error (user does not own selected property)', async () => {
    (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({
      ownerId: process.env.SECOND_ID,
    });

    const { spyReply } = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toMatch(
      /Sorry! You don't own property `([^`]+)` in the current game \(game #\d+\)/,
    );
  });


  it('should error (user owns property, but not the whole color)', async () => {
    (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({
      ownerId: process.env.AUTHOR_ID,
    });

    const { spyReply } = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toMatch(
      /You cannot build in color ([^.]+). You need to \*\*own all properties in that color\*\* first!/,
    );
  });


  it('should show buy prompt', async () => {
    await authorOwnsAllBrownProperties();

    const { spyReply } = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.title).toMatch(/Build operation summary in `([^`]+)`/);
  });


  it("should cancel the operation (user selected 'No')", async () => {
    await authorOwnsAllBrownProperties();

    const mockPromptOperation = jest.fn().mockResolvedValue(false);

    const promptSpy = spyOn(actualOwnedPropertyOps, 'promptOperation').mockImplementation(mockPromptOperation);
    const { spyFollowUp } = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);

    expect(promptSpy).toHaveBeenCalled();
    expect(spyFollowUp).toHaveBeenCalledWith('Operation cancelled.');
  });


  it('should error (user does not have enough money to build)', async () => {
    (await Player.findOne({ where: { userId: process.env.AUTHOR_ID } }))!.update({ money: 0 })

    await authorOwnsAllBrownProperties();

    const mockPromptOperation = jest.fn().mockResolvedValue(true);

    spyOn(actualOwnedPropertyOps, 'promptOperation').mockImplementation(mockPromptOperation);
    const { spyReply } = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe("User does not have enough money:\nMoney Left: `0`");
  });


  it('should add a building to property and remove money from user', async () => {
    const moneyBefore = (await Player.findOne({ where: { userId: process.env.AUTHOR_ID } }))!.money;

    await authorOwnsAllBrownProperties();

    const mockPromptOperation = jest.fn().mockResolvedValue(true);

    spyOn(actualOwnedPropertyOps, 'promptOperation').mockImplementation(mockPromptOperation);
    const { spyFollowUp } = await mockInteractionAndSpyReply('build', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);

    const moneyAfter = (await Player.findOne({ where: { userId: process.env.AUTHOR_ID } }))!.money;
    const numBuildings = (await PropertyGame.findOne({ where: { id: 1 } }))!.numBuildings;

    expect(moneyAfter).toBeLessThan(moneyBefore);
    expect(numBuildings).toEqual(1);
    expect(spyFollowUp).toHaveBeenCalledWith(expect.stringMatching(/You now own 1 houses in `Brown 1` for `50`..*/));
  });

});

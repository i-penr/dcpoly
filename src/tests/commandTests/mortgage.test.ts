import { beforeEach, describe, expect, it, jest, spyOn } from "bun:test";
import { mockDb } from "../mockDb";
import { Game } from "../../db/tables/Game";
import { mockInteractionAndSpyReply } from "../mockDiscord";
import type { Sequelize } from "sequelize";
import type { CommandInteractionOptionResolver, Message } from "discord.js";
import { PropertyGame } from "../../db/tables/PropertyGame";
import * as actualOwnedPropertyOps from '../../utils/ownedPropertyOperations';
import { authorOwnsAllBrownProperties } from "../testUtils";
import { Player } from "../../db/tables/Player";

describe('/mortgage command tests', async () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = await mockDb();
  });


  it('should throw error message, game null', async () => {
    await sequelize.truncate();

    const { spyReply } = await mockInteractionAndSpyReply('mortgage');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe(
      'There are no **active** games on this server. Create a game with `/newgame`'
    );
  });


  it('should error (no active games in server)', async () => {
    (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

    const { spyReply } = await mockInteractionAndSpyReply('mortgage');
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toBe(
      'There are no **active** games on this server. Create a game with `/newgame`',
    );
  });


  it('should error (user does not own selected property)', async () => {
    (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({
      ownerId: process.env.SECOND_ID,
    });

    const { spyReply } = await mockInteractionAndSpyReply('mortgage', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toMatch(
      /Sorry! You don't own property `([^`]+)` in the current game \(game #\d+\)/,
    );
  });

  it('should error (property is already mortgaged)', async () => {
    (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({
      ownerId: process.env.AUTHOR_ID,
      mortgaged: true
    });

    const { spyReply } = await mockInteractionAndSpyReply('mortgage', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toMatch(
      /Property .* is already mortgaged. Run `\/unmortgage` to unmortgage it for `.*`/
    );
  })


  it('should error (property has buildings)', async () => {
    (await PropertyGame.findOne({ where: { gameId: process.env.GAME_ID, id: 1 } }))?.update({
      ownerId: process.env.AUTHOR_ID,
      numBuildings: 1
    });

    const { spyReply } = await mockInteractionAndSpyReply('mortgage', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);
    const reply = spyReply.mock.calls[0]![0] as Message;

    expect(reply.embeds[0]!.data.description).toMatch(
      /You cannot mortgage the property .* because there are buildings present in color .*/
    );
  })

  it("should cancel the operation (user selected 'No')", async () => {
    await authorOwnsAllBrownProperties();

    const mockPromptOperation = jest.fn().mockResolvedValue(false);

    const promptSpy = spyOn(actualOwnedPropertyOps, 'promptOperation').mockImplementation(mockPromptOperation);
    const { spyFollowUp } = await mockInteractionAndSpyReply('mortgage', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);

    expect(promptSpy).toHaveBeenCalled();
    expect(spyFollowUp).toHaveBeenCalledWith('Operation cancelled.');
  });


  it('should mortgage the property and add money to the user', async () => {
    const moneyBefore = (await Player.findOne({ where: { userId: process.env.AUTHOR_ID } }))!.money;

    await authorOwnsAllBrownProperties();

    const mockPromptOperation = jest.fn().mockResolvedValue(true);

    spyOn(actualOwnedPropertyOps, 'promptOperation').mockImplementation(mockPromptOperation);
    const { spyFollowUp } = await mockInteractionAndSpyReply('mortgage', { getInteger: () => 1 } as unknown as CommandInteractionOptionResolver);

    const moneyAfter = (await Player.findOne({ where: { userId: process.env.AUTHOR_ID } }))!.money;
    const mortgaged = (await PropertyGame.findOne({ where: { id: 1 } }))!.mortgaged;

    expect(moneyBefore).toBeLessThan(moneyAfter);
    expect(mortgaged).toBeTrue();
    expect(spyFollowUp).toHaveBeenCalledWith(expect.stringMatching(/You have \*\*mortgaged\*\* `Brown 1`. You've earned `30`*/));
  });
});

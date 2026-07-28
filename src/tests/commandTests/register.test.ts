import { beforeEach, describe, expect, it } from 'bun:test';
import { mockDb } from '../mockDb';
import { mockInteractionAndSpyReply } from '../mockDiscord';
import { Game } from '../../db/tables/Game';
import { Player } from '../../db/tables/Player';
import { User } from '../../db/tables/User';
import type { Sequelize } from 'sequelize';
import type { Message } from 'discord.js';

describe('/property command tests', async () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = await mockDb();
  });


	beforeEach(async () => {
		sequelize = await mockDb();
		(await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });
	});

	it('should error (game active)', async () => {
		(await Game.findByPk(process.env.GAME_ID))?.update({ status: 'active' });
		
    const { spyReply } = await mockInteractionAndSpyReply('register');
    const reply = spyReply.mock.calls[0]![0] as Message;

		expect(reply.embeds[0]!.data.description).toBe("There aren't any games waiting on this server.");
	});

	it('should error (no new games waiting)', async () => {
		await sequelize.truncate();

    const { spyReply } = await mockInteractionAndSpyReply('register');
    const reply = spyReply.mock.calls[0]![0] as Message;

		expect(reply.embeds[0]!.data.description).toBe("There aren't any games waiting on this server.");
	});

	it('should error (player already in game)', async () => {
    const { spyReply } = await mockInteractionAndSpyReply('register');
    const reply = spyReply.mock.calls[0]![0] as Message;

		expect(reply.embeds[0]!.data.description).toBe(
			'You are already registered in the current game.',
		);
	});

	it('should error (maximum amount of players reached)', async () => {
		await Player.destroy({ where: { userId: process.env.AUTHOR_ID, gameId: process.env.GAME_ID } });
		await User.bulkCreate([
			{ id: '11111111111111111112' },
			{ id: '11111111111111111113' },
			{ id: '11111111111111111114' },
			{ id: '11111111111111111115' },
			{ id: '11111111111111111116' },
			{ id: '11111111111111111117' },
			{ id: '11111111111111111118' },
		]);
		await Player.bulkCreate([
			{ gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111112' },
			{ gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111113' },
			{ gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111114' },
			{ gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111115' },
			{ gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111116' },
			{ gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111117' },
			{ gameId: parseInt(process.env.GAME_ID!), userId: '11111111111111111118' },
		]);

    const { spyReply } = await mockInteractionAndSpyReply('register');
    const reply = spyReply.mock.calls[0]![0] as Message;

		expect(reply.embeds[0]!.data.description).toBe(
			'The game has reached its maximum amount of players (8). Run `/startgame` to start.',
		);
	});

	it('should add the existing player to the game', async () => {
		await Player.destroy({ where: { userId: process.env.AUTHOR_ID, gameId: process.env.GAME_ID } });
  
    const { spyReply } = await mockInteractionAndSpyReply('register');
    const reply = spyReply.mock.calls[0]![0] as Message;

		expect(reply).toMatch(/User .* added successfully to the game./);
		expect(
			await Player.findOne({
				where: { gameId: process.env.GAME_ID, userId: process.env.AUTHOR_ID },
			}),
		).toBeDefined();
	});

	it('should create the user and add it to the game', async () => {
		await Player.destroy({ where: { userId: process.env.AUTHOR_ID, gameId: process.env.GAME_ID } });
		await User.destroy({ where: { id: process.env.AUTHOR_ID } });

    const { spyReply } = await mockInteractionAndSpyReply('register');
    const reply = spyReply.mock.calls[0]![0] as Message;

		expect(reply).toMatch(/User .* added successfully to the game./);
		expect(
			await Player.findOne({
				where: { gameId: process.env.GAME_ID, userId: process.env.AUTHOR_ID },
			}),
		).toBeDefined();
	});
});

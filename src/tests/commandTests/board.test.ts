/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from 'bun:test';
import { mockInteractionAndSpyReply } from '../mockDiscord';
import { Game } from '../../db/tables/Game';
import { Player } from '../../db/tables/Player';
import { mockDb } from '../mockDb';
import type { Sequelize } from 'sequelize';

describe('/board command tests', () => {
	let spy: any, sequelize: Sequelize;

	beforeEach(async () => {
		sequelize = await mockDb();
	});

	it('should throw error message, game null', async () => {
		await sequelize.truncate();

		spy = await mockInteractionAndSpyReply('board');
		const reply = spy.mock.calls[0][0];

		expect(reply.embeds[0].data.description).toBe(
			'There are no **active** games on this server. Create a game with `/newgame`',
		);
	});

	it("should return the current game's board", async () => {
		spy = await mockInteractionAndSpyReply('board');
		const reply = spy.mock.calls[0][0];

		expect(reply.embeds[0].data.title).toMatch(/.*'s board - Game #.*/);
	});

	it('should have all the players included in the description', async () => {
		spy = await mockInteractionAndSpyReply('board');
		const reply = spy.mock.calls[0][0];

		expect(reply.embeds[0].data.description.match(/-/g).length).toBe(
			(await Player.findAll()).length,
		);
	});

	it('should throw error message, game not in active state', async () => {
		await (await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

		spy = await mockInteractionAndSpyReply('board');

		const reply = spy.mock.calls[0][0];
		expect(reply.embeds[0].data.description).toBe(
			'There are no **active** games on this server. Create a game with `/newgame`',
		);
	});
});

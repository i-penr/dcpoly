/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from 'bun:test';
import { mockDb } from '../mockDb';
import { Game } from '../../db/tables/Game';
import { mockInteractionAndSpyReply } from '../mockDiscord';

describe('/newgame command tests', async () => {
	let spy: any, sequelize: any;

	beforeEach(async () => {
		sequelize = await mockDb();
	});

	it('should error (active game exists in server)', async () => {
		spy = await mockInteractionAndSpyReply('newgame');

		const reply = spy.mock.calls[0][0];
		expect(reply.embeds[0].data.description).toBe(
			`There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`,
		);
	});

	it('should error (newly created game exists in server)', async () => {
		(await Game.findByPk(process.env.GAME_ID))?.update({ status: 'new' });

		spy = await mockInteractionAndSpyReply('newgame');
		const reply = spy.mock.calls[0][0];
		expect(reply.embeds[0].data.description).toBe(
			`There is already a game with the status *new* or *active* on this server.\n**Finish** the game first before creating a new one.`,
		);
	});

	it('should create a new game successfully', async () => {
		await sequelize.truncate();

		spy = await mockInteractionAndSpyReply('newgame');
		const reply = spy.mock.calls[0][0];
		expect(reply).toMatch(/New game #.* created sucessfully./);
	});
});

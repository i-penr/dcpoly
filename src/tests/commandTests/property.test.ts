/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from 'bun:test';
import type { Sequelize } from 'sequelize';
import { mockDb } from '../mockDb';
import { mockInteractionAndSpyReply } from '../mockDiscord';

describe('/property command tests', async () => {
	let spy: any, sequelize: Sequelize;

	beforeEach(async () => {
		sequelize = await mockDb();
	});

	it('should error, provided id does not match any property id', async () => {
		await sequelize.truncate();
		spy = await mockInteractionAndSpyReply('property', { getInteger: () => 2 } as any);

		const reply = spy.mock.calls[0][0];
		expect(reply.embeds[0].data.description).toBe(
			"undefined is not an object (evaluating 'property.color')",
		);
	});

	it('no game, should show property data, without game-related stuff', async () => {
		await sequelize.truncate();
		spy = await mockInteractionAndSpyReply('property', { getInteger: () => 1 } as any);

		const reply = spy.mock.calls[0][0];
		expect(reply.embeds[0].data.title).toBe('Brown 1');
	});

	it('game active, should show property data, with game-related stuff', async () => {
		spy = await mockInteractionAndSpyReply('property', { getInteger: () => 1 } as any);

		const reply = spy.mock.calls[0][0];
		expect(reply.embeds[0].data.title).toBe('Brown 1');
		expect(reply.embeds[0].data.description).toInclude('Owned By');
	});
});

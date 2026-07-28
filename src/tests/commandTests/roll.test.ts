/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, test } from 'bun:test';
import { mockDb } from '../mockDb';
import { mockInteractionAndSpyReply } from '../mockDiscord';
import { Game } from '../../db/tables/Game';
import { Player } from '../../db/tables/Player';

describe('/roll command tests', async () => {
	let spy: any, game: Game, player: Player;

	beforeEach(async () => {
		await mockDb();
		game = (await Game.findByPk(process.env.GAME_ID))!;
		player = (await Player.findOne({
			where: { userId: process.env.AUTHOR_ID, gameId: process.env.GAME_ID },
		}))!;
	});

	test.todo('should error (no active game in server)', async () => {
		game.update({ status: 'new' });

		spy = await mockInteractionAndSpyReply('roll');

		const reply = spy.mock.calls[0][0];

		expect(reply.embeds[0].data.description).toBe(
			'There are no **active** games on this server. Create a game with `/newgame`',
		);
	});

	test.todo('should error (author not in game)', async () => {
		await player.destroy();

		spy = await mockInteractionAndSpyReply('roll');

		const reply = spy.mock.calls[0][0];

		expect(reply.embeds[0].data.description).toBe(
			'User is not registered in the current game. No players can register, since the game has already started.',
		);
	});

	// TODO: test this properly. Roll is a very complex command
	/* it('should prompt that player is in jail', async () => {
        await player.update({ jailStatus: 0 });

        spy = await mockInteractionAndSpyReply('roll');

        const reply = spy.mock.calls[0][0];

        expect(reply.embeds[0]).toBe('');
    }); */
});

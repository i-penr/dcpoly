import { expect, it } from 'bun:test';
import { mockInteractionAndSpyReply } from '../mockDiscord';

it('should return "Pong!" with the current ping', async () => {
  const { spyReply } = await mockInteractionAndSpyReply('ping');
	const reply = Array.from(spyReply.mock.calls[0]!);

	expect(reply[0]).toMatch(/Pong!\nLatency: \d+ ms/);
});

import { expect, it } from "bun:test";
import { mockInteractionAndSpyReply } from "./mockDiscord";

it('should return "Pong!" with the current ping', async () => {
    const spy = await mockInteractionAndSpyReply('ping');
    const reply = Array.from(spy.mock.calls[0]);

    expect(reply[0]).toMatch(/Pong!\nLatency: \d+ ms/);
});
import { User } from 'discord.js';
import Client from '../models/classes/Client';

export function mockUser(options: { id: string; username: string }) {
	return Reflect.construct(User, [
		Client.getInstance(),
		{ id: options.id, username: options.username },
	]);
}

import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export default interface Command {
	data:
		| SlashCommandBuilder
		| SlashCommandSubcommandsOnlyBuilder
		| Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
	execute: (interacion: ChatInputCommandInteraction) => Promise<void>;
}

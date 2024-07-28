import { CommandInteraction, SlashCommandBuilder} from "discord.js";
import Command from '../../models/interfaces/Command';
import { buildBoardEmbed } from "../../utils/buildBoardEmbed";
import { drawBoard } from "../../utils/drawBoard";
import { Player } from "../../db/Player";

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('register')
            .setDescription('Register to a game as a player!'),
    async execute(interaction: CommandInteraction) {
        try {
            const player = await Player.create({
                username: interaction.user.username,
            });
            interaction.reply(`User ${player.get('username')} added successfully to the game.`);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
				interaction.reply('That user is already registered.');
			}

			interaction.reply('Something went wrong with adding a tag.');
        }

    },
}

export  { command };
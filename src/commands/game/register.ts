import { CommandInteraction, SlashCommandBuilder} from "discord.js";
import Command from '../../models/interfaces/Command';
import { User } from "../../db/tables/User";
import { Players } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('register')
            .setDescription('Register to a game as a player!'),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await Game.findOne({ where: { guild_id: interaction.guildId }});
            
            if (!game) {
                interaction.reply('There aren\'t any games waiting on this server.');
                return;
            }
            
            const authorId = interaction.user.id;
            let user = await User.findOne({ where: { id: authorId }});

            if (!user) {
                user = await User.create({
                    id: authorId,
                });
                console.log(`User ${user.get('id')} added to database.`);
            }
            
            await Players.create({
                gameId: game.get('id'),
                userId: user.get('id')
            });

            interaction.reply(`User ${interaction.user.username} added successfully to the game.`);

        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
				interaction.reply('You are already registered in the current game.');
                return;
			}

			interaction.reply('Something went wrong with adding a user to the game.');
            console.error(error);
        }

    },
}

export  { command };
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from '../../models/interfaces/Command';
import { User } from "../../db/tables/User";
import { Player } from "../../db/tables/Player";
import { buildErrorEmbed } from "../../utils/buildErrorEmbedResponse";
import { getGameFromGuildWithStatus } from "../../utils/database";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register to a game as a player!'),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getGameFromGuildWithStatus(interaction.guildId!, 'new');

            if (!game) {
                interaction.reply(buildErrorEmbed(interaction, 'There aren\'t any games waiting on this server.'));
                return;
            }

            const players = game.players ?? [];

            if (players.find((p) => p.userId === interaction.user.id)) {
                interaction.reply(buildErrorEmbed(interaction, 'You are already registered in the current game.'));
                return;
            }

            if (players.length > 8) {
                interaction.reply(buildErrorEmbed(interaction, 'The game has reached its maximum amount of players (8). Run `/startgame` to start.'));
                return;
            }

            const authorId = interaction.user.id;
            let user = await User.findOne({ where: { id: authorId } });

            if (!user) {
                user = await User.create({
                    id: authorId,
                });
                console.log(`User ${user.get('id')} added to database.`);
            }

            await Player.create({
                userId: user.get('id'),
                gameId: game.get('id'),
            });

            interaction.reply(`User ${interaction.user.username} added successfully to the game.`);

        } catch (error: any) {
            interaction.reply('Something went wrong with adding a user to the game.');
            console.error(error);
        }
    },
}

export { command };
import { CommandInteraction, SlashCommandBuilder} from "discord.js";
import Command from '../../models/interfaces/Command';
import { Turn } from "../../db/tables/Turn";
import { getGameFromGuildWithStatus } from "../../utils/database";
import { Property } from "../../db/tables/Property";
import { getProperties } from "../../utils/actions/propertyTurn";
import { buildErrorEmbed } from "../../utils/embeds/buildErrorEmbedResponse";

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('startgame')
            .setDescription('Start a game with the status new.'),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getGameFromGuildWithStatus(interaction.guildId!, 'new');

            if (!game) {
                interaction.reply(buildErrorEmbed(interaction, 'There are no games with the status `new` on the server. Create a new game with `/newgame`'));
                return;
            }

            const gameId: number = game.get('id');
            const players = game.players ?? [];

            if (players.length < 2) {
                interaction.reply(buildErrorEmbed(interaction, `There are not enough players in game **#${gameId}** to start!`));
                return;
            }

            for (let player of players) {
                Turn.create({
                    playerOrder: players.indexOf(player),
                    gameId: player.get('gameId'),
                    userId: player.get('userId')
                });
            }

            const properties = getProperties();
            properties.map((p: any) => p.gameId = gameId);
            await Property.bulkCreate(properties);
            game.update({ status: 'active', start_date: new Date(), currentTurn: 0 });

            interaction.reply(`Game #${gameId} has now started!`);
        } catch (error: any) {
            console.log(error);
			interaction.reply('Something went wrong when creating a new game.');
        }
    },
}

export  { command };
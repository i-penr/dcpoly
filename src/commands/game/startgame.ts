import { CommandInteraction, SlashCommandBuilder} from "discord.js";
import Command from '../../models/interfaces/Command';
import { Game } from "../../db/tables/Game";
import { getPlayersInGame } from "../../utils/database";

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('startgame')
            .setDescription('Start a game with the status new.'),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await Game.findOne({ where: { guild_id: interaction.guildId, status: 'new' }});

            if (!game) {
                interaction.reply('There are no games with the status `new` on the server. Create a new game with `/newgame`');
                return;
            }

            const gameId: number = game.get('id') as number;
            const players = await getPlayersInGame(gameId);

            if (players.length < 2) {
                interaction.reply(`There are not enough players in game **#${gameId}** to start!`);
                return;
            }

            game.update({ status: 'active' });

            interaction.reply(`Game #${gameId} has now started!.`);
        } catch (error: any) {
            console.log(error);
			interaction.reply('Something went wrong when creating a new game.');
        }
    },
}

export  { command };
import { CommandInteraction, SlashCommandBuilder} from "discord.js";
import Command from '../../models/interfaces/Command';
import { Game } from "../../db/tables/Game";
import { Op } from "sequelize";
import { buildErrorEmbed } from "../../utils/embeds/buildErrorEmbedResponse";
import { getGameFromGuildWithStatus } from "../../utils/database";

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('newgame')
            .setDescription('Create a new game.'),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getGameFromGuildWithStatus(interaction.guildId!, { [Op.not]: 'finished' });

            if (game) {
                interaction.reply(buildErrorEmbed(interaction, `There is already a game with the status *${game.get('status')}* or *active*
                                                                on this server. **Finish** the game first before creating a new one.`));
                return;
            }

            const newGame = await Game.create({
                guild_id: interaction.guildId!
            });
            
            interaction.reply(`New game #${newGame.get('id')} created sucessfully.`);
        } catch (error: any) {
            console.log(error);
			interaction.reply(buildErrorEmbed(interaction, 'Something went wrong when creating a new game.'));
        }
    },
}

export  { command };
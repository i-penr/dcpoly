import { ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import type Command from '../../models/interfaces/Command';
import { Turn } from "../../db/tables/Turn";
import { getGameFromGuildWithStatus } from "../../utils/database";
import { getProperties } from "../../utils/actions/propertyActions";
import { buildErrorEmbed } from "../../utils/embeds/buildErrorEmbedResponse";
import { PropertyGame } from "../../db/tables/PropertyGame";
import { handleCommandError } from "../../utils/validations";

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('startgame')
            .setDescription('Start a game with the status new.'),
    async execute(interaction: ChatInputCommandInteraction) {
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

            for (const player of players) {
                Turn.create({
                    playerOrder: players.indexOf(player),
                    gameId: gameId,
                    userId: player.get('userId')
                });
            }

            const properties = getProperties();

            properties.forEach(({ id }: { id: number }) => {
                PropertyGame.create({ id: id, gameId: gameId });
            });

            game.update({ status: 'active', start_date: new Date(), currentTurn: 0 });

            interaction.reply(`Game #${gameId} has now started!`);
        } catch (error: unknown) {
            handleCommandError(interaction, error as Error)
        }
    },
}

export  { command };
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from "../../models/interfaces/Command";
import { buildBoardEmbed } from "../../utils/buildBoardEmbed";
import { drawBoard } from "../../utils/drawBoard";
import { getCurrentActiveGame } from "../../utils/database";
import { Player } from "../../db/tables/Player";
import { buildErrorEmbed } from "../../utils/buildErorEmbedResponse";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Rolls the dice!"),
    async execute(interaction: CommandInteraction) {
        const game = await getCurrentActiveGame(interaction.guildId!);

        if (!game) {
            interaction.reply(buildErrorEmbed(interaction, 'There are no **active** games on this server. Create a game with `/newgame`'));
            return;
        }

        const result1 = Math.floor(Math.random() * 6) + 1;
        const result2 = Math.floor(Math.random() * 6) + 1;

        try {
            await updatePlayerPosition(result1 + result2, interaction.user.id, game.get("id"));
        } catch (error: any) {
            if (error.message === 'PlayerNotInGame') {
                interaction.reply(buildErrorEmbed(interaction, `User ${interaction.user} is not registered in the current game. Run \`/register\` to join game ${game.get('id')}`))
                return;
            }

            console.error(error);
            interaction.deferReply({ ephemeral: true });
            return;
        }

        const boardImg = await drawBoard(interaction, (game.get('id') as number));

        const boardEmbed = buildBoardEmbed(interaction)
            .setTitle(`${interaction.user.username}'s roll`)
            .setDescription(`You rolled a **${result1}** and a **${result2}**`);

        interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
    },
};

async function updatePlayerPosition(roll: number, userId: string, gameId: number) {
    const player = await Player.findOne({
        where: { 
            userId: userId,
            gameId: gameId
        },
    });

    if (player) {
        player.update({ current_square: (roll + (player.get('current_square') as number)) % 40 })
    } else {
        throw new Error('PlayerNotInGame')
    }
}

export { command };

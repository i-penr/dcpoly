import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from "../../models/interfaces/Command";
import { buildBoardEmbed } from "../../utils/buildBoardEmbed";
import { drawBoard } from "../../utils/drawBoard";
import { getCurrentActiveGame } from "../../utils/database";
import { Player } from "../../db/tables/Player";
import { buildErrorEmbed } from "../../utils/buildErorEmbedResponse";
import { Game } from "../../db/tables/Game";
import { Turn } from "../../db/tables/Turn";

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

        const player = await Player.findOne({
            where: { 
                userId: interaction.user.id,
                gameId: game.get("id")
            },
        });

        if (!player) {
            interaction.reply(buildErrorEmbed(interaction, `User ${interaction.user} is not registered in the current game. Run \`/register\` to join game ${game.get('id')}`));
            return;
        }

        if (!await isPlayersTurn(game, player)) {
            interaction.reply({ ...buildErrorEmbed(interaction, `It is not your turn!`), ephemeral: true});
            return;
        }

        game.update({ currentTurn: (game.get('currentTurn') + 1) % game.get('players')!.length });

        const result1 = Math.floor(Math.random() * 6) + 1;
        const result2 = Math.floor(Math.random() * 6) + 1;

        try {
            await player.update({ current_square: (result1+result2 + (player.get('current_square') as number)) % 40 })
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


async function isPlayersTurn(game: Game, player: Player) {
    const currentTurn = game.get('currentTurn');
    const playerTurnId = await Turn.findOne({ where: { gameId: game.get('id'), userId: player.get('userId') } });

    return currentTurn === playerTurnId?.get('playerOrder');
}

export { command };

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';
import { Turn } from '../../db/tables/Turn';
import { buildTemplateEmbed } from '../../utils/embeds/buildTemplateEmbed';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('turn')
        .setDescription('Shows whose turn it is, and the turn order.'),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);
            const turns = await Turn.findAll({ where: { gameId: game.id } });
            const currentTurn = game.currentTurn;
            const embed = buildTemplateEmbed()
                .setTitle(`Turn order for Game #${game.id}`)
                .setThumbnail(interaction.guild?.iconURL() ?? '');
            let embedDescription = 'Turn order:\n';

            turns.forEach((turn, index) => {
                embedDescription += `<@${turn.userId}> ${index === turns.length - 1 ? '': '>'} `;

                if (index === currentTurn) {
                    embedDescription = `Current turn: <@${turn.userId}>\n\n${embedDescription}`;
                }
            })

            embed.setDescription(embedDescription);
            interaction.reply({ embeds: [embed] });
        } catch (error: unknown) {
            handleCommandError(interaction, error as Error);
        }
    },
};

export { command };

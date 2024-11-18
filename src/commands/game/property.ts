
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../../models/interfaces/Command';
import { buildErrorEmbed } from '../../utils/embeds/buildErrorEmbedResponse';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';
import { Property } from '../../db/tables/Property';
import { buildPropertyEmbed } from '../../utils/embeds/buildPropertyEmbed';
import { Square } from '../../db/tables/Square';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('property')
        .setDescription('Shows information about a property in the game.')
        .addIntegerOption(option =>
            option.setName('propertynumber')
                .setDescription('The number of the square of the property you want to inspect.')
                .setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);

            if (!game) {
                interaction.reply(buildErrorEmbed(interaction, 'There are no current active games on the server.'));
                return;
            }

            const selectedId = await (interaction.options as any).getInteger('propertynumber');
            const property = await Property.findOne({ where: { id: selectedId } });
            const square = await Square.findOne({ where: { id: selectedId } });
            const propertyEmbed = await buildPropertyEmbed(property!, square!);

            interaction.reply({ embeds: [propertyEmbed] });
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
}

export { command }
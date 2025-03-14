import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../../models/interfaces/Command';
import { handleCommandError } from '../../utils/validations';
import { buildPropertyEmbed } from '../../utils/embeds/buildPropertyEmbed';
import { getProperties, getPropertyFromId } from '../../utils/actions/propertyActions';
import Property from '../../models/interfaces/Property';
import { getGameFromGuildWithStatus } from '../../utils/database';

const properties = getProperties();

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('property')
        .setDescription('Shows information about a property in the game.')
        .addIntegerOption(option => {
            option.setName('property-name')
                .setDescription('The property you want to inspect.')
                .setRequired(true);

            properties.forEach((property: Property) => {
                option.addChoices({ name: property.name, value: property.id });
            });

            return option;
        }),
    async execute(interaction: CommandInteraction) {
        try {
            const selectedProperty = getPropertyFromId(await (interaction.options as any).getInteger('property-name'));
            const game = await getGameFromGuildWithStatus(interaction.guildId!, 'active');
            const propertyEmbed = await buildPropertyEmbed(selectedProperty, game ?? undefined);

            interaction.reply({ embeds: [propertyEmbed] });
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
}

export { command }
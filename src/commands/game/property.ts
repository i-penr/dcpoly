import { ChatInputCommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { handleCommandError } from '../../utils/validations';
import { buildPropertyEmbed } from '../../utils/embeds/buildPropertyEmbed';
import { getProperties, getPropertyFromId } from '../../utils/actions/propertyActions';
import type Property from '../../models/interfaces/Property';
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
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const selectedProperty = getPropertyFromId((interaction.options as CommandInteractionOptionResolver).getInteger('property-name')!);
            const game = await getGameFromGuildWithStatus(interaction.guildId!, 'active');
            const propertyEmbed = await buildPropertyEmbed(selectedProperty, game ?? undefined);

            interaction.reply({ embeds: [propertyEmbed] });
        } catch (error: unknown) {
            handleCommandError(interaction, error as Error);
        }
    },
}

export { command }
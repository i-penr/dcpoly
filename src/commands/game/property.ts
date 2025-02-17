import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../../models/interfaces/Command';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';
import { buildPropertyEmbed } from '../../utils/embeds/buildPropertyEmbed';
import { Square } from '../../db/tables/Square';
import { Property } from '../../db/tables/Property';
import fs from 'fs';
import path from 'path';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('property')
        .setDescription('Shows information about a property in the game.')
        .addIntegerOption(option => {
            const squares = (JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'squares.json'), 'utf-8')));
            const properties = (JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'properties.json'), 'utf-8')));

            option.setName('property-name')
                .setDescription('The property you want to inspect.')
                .setRequired(true);

            properties.forEach((property: any, index: number) => {
                option.addChoices({ name: squares[property.id].name, value: property.id })
            })

            return option;
        }),
    async execute(interaction: CommandInteraction) {
        try {
            const game = await getCurrentGameOrFail(interaction.guildId!);

            const selectedId = await (interaction.options as any).getInteger('property-name');
            const square = await Square.findOne({ where: { id: selectedId }, include: [{ model: Property, where: { gameId: game.id } }] });
            const propertyEmbed = await buildPropertyEmbed(square!);

            interaction.reply({ embeds: [propertyEmbed] });
        } catch (error: any) {
            handleCommandError(interaction, error);
        }
    },
}

export { command }
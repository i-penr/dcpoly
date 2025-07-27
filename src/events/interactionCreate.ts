import { BaseInteraction, Events } from "discord.js";
import Event from "../models/classes/Event";
import type Command from "../models/interfaces/Command";
import Client from "../models/classes/Client";

const event = new Event(Events.InteractionCreate, false, async (interaction) => {
    if (interaction instanceof BaseInteraction) {
        if (!interaction.isChatInputCommand()) return;

        const executedCommand: Command | undefined = (interaction.client as Client).commands!.get(interaction.commandName);

        if (!executedCommand) {
            console.error(`[ERROR] Command '${interaction.commandName}' does not exist.`);
            return;
        }

        try {
            await executedCommand.execute(interaction);
        } catch (error) {
            console.error(error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command', ephemeral: true })
            }
        }
    }
});

export { event };
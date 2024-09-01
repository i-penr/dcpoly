import { CommandInteraction, EmbedBuilder } from "discord.js";

export const buildTemplateEmbed = (interaction: CommandInteraction): EmbedBuilder => {
    const boardEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setFooter({ text: 'not monop**y', iconURL: interaction.client.user.avatarURL()! })
        .setTimestamp();

    return boardEmbed;
}
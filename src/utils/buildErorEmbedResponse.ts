import { AttachmentBuilder, CommandInteraction, EmbedBuilder } from "discord.js";

export const buildErrorEmbed = (interaction: CommandInteraction, errMsg: string): { embeds: EmbedBuilder[], files: AttachmentBuilder[] } => {
    const file = new AttachmentBuilder('./assets/error.png');

    const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setAuthor({ name: interaction.client.user.displayName, iconURL: interaction.client.user.avatarURL()! })
        .setTitle(`There was an error with the command \`/${interaction.commandName}\``)
        .setDescription(errMsg)
        .setThumbnail("attachment://error.png")
        .setFooter({ text: 'not monop**y', iconURL: interaction.client.user.avatarURL()! })
        .setTimestamp();

    return { embeds: [errorEmbed], files: [file] };
}
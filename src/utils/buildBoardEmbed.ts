import { CommandInteraction, EmbedBuilder } from "discord.js";

export const buildBoardEmbed = (interaction: CommandInteraction): EmbedBuilder => {
    const boardEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setImage('attachment://board.png')
        .setFooter({ text: 'not monop**y', iconURL: interaction.client.user.avatarURL()! })
        .setTimestamp();

    return boardEmbed;
}
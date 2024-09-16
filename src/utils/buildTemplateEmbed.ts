import { EmbedBuilder } from "discord.js";
import { client } from "..";

export const buildTemplateEmbed = (): EmbedBuilder => {
    const boardEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setFooter({ text: 'not monop**y', iconURL: client.user!.avatarURL()! })
        .setTimestamp();

    return boardEmbed;
}
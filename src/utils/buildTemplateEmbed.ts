import { EmbedBuilder } from "discord.js";
import Client from "../models/classes/Client";

export const buildTemplateEmbed = (): EmbedBuilder => {
    const boardEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setFooter({ text: 'not monop**y', iconURL: Client.getInstance().user!.avatarURL()! })
        .setTimestamp();

    return boardEmbed;
}
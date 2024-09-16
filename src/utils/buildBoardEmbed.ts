import { CommandInteraction, EmbedBuilder } from "discord.js";
import { buildTemplateEmbed } from "./buildTemplateEmbed";

export const buildBoardEmbed = (): EmbedBuilder => {
    const boardEmbed = buildTemplateEmbed()
        .setImage('attachment://board.png')
        
    return boardEmbed;
}
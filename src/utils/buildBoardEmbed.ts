import { CommandInteraction, EmbedBuilder } from "discord.js";
import { buildTemplateEmbed } from "./buildTemplateEmbed";

export const buildBoardEmbed = (interaction: CommandInteraction): EmbedBuilder => {
    const boardEmbed = buildTemplateEmbed(interaction)
        .setImage('attachment://board.png')
        
    return boardEmbed;
}
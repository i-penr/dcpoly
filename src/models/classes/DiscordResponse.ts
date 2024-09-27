import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";

export default class DiscordResponse {
    embeds: EmbedBuilder[];
    actionRow: ActionRowBuilder<ButtonBuilder>;

    public constructor(embeds?: EmbedBuilder[]) {
        this.embeds = embeds ?? [];
        this.actionRow = new ActionRowBuilder<ButtonBuilder>();
    }
}
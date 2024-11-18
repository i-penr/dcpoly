import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Message } from "discord.js";

export default class DiscordResponse {
    embeds: EmbedBuilder[];
    actionRow: ActionRowBuilder<ButtonBuilder>;
    response?: Message;

    public constructor(embeds?: EmbedBuilder[]) {
        this.embeds = embeds ?? [];
        this.actionRow = new ActionRowBuilder<ButtonBuilder>();
    }
}
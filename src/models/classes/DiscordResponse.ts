import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionReplyOptions, InteractionResponse, Message, MessagePayload } from "discord.js";

export interface ButtonData {
    id: string;
    label: string;
    style: ButtonStyle;
    disabled?: boolean;
}

export default class DiscordResponse {
    embeds: EmbedBuilder[];
    actionRow: ActionRowBuilder<ButtonBuilder>;
    response?: Message | InteractionResponse;

    public constructor(embeds?: EmbedBuilder[]) {
        this.embeds = embeds ?? [];
        this.actionRow = new ActionRowBuilder<ButtonBuilder>();
    }

    public addButtons(...buttonData: ButtonData[]) {
        const buttons = buttonData.map(({ id, label, style, disabled }) =>
            new ButtonBuilder()
                .setCustomId(id)
                .setLabel(label)
                .setStyle(style)
                .setDisabled(disabled ?? false)
        );

        this.actionRow.addComponents(...buttons);
    }

    public generateResponsePayload(): string | MessagePayload | InteractionReplyOptions {
        return { embeds: this.embeds, components: [this.actionRow] };
    }
}
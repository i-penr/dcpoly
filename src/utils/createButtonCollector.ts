import { ChatInputCommandInteraction, ComponentType, InteractionResponse, Message } from "discord.js";

export function createButtonCollector(response: InteractionResponse | Message, interaction: ChatInputCommandInteraction) {
    return response.createMessageComponentCollector({
        componentType: ComponentType.Button, time: 60000,
        filter: (i: any) => {
            i.deferUpdate();
            return i.user.id === interaction.user.id
        }
    });
}
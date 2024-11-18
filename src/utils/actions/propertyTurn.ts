import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Property } from "../../db/tables/Property";
import { Square } from "../../db/tables/Square";
import { buildTemplateEmbed } from "../embeds/buildTemplateEmbed";
import fs from 'node:fs';
import path from "node:path";

export function getProperties() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'properties.json'), 'utf-8'));
}

export function getPropertyFromStatic(square: Square) {
    return getProperties().find((p: any) => p.id = square.id);
}

export async function generatePropertyEmbed(property: Property): Promise<EmbedBuilder> {
    const purchaseEmbed = buildTemplateEmbed()
        .setTitle(property.square.name)
        .setColor(property.color)
        .setDescription(`Base rent: \`${property.square.rent}\`\nPrice: \`${property.price}\`\nHouse Price: ....`)
        .addFields([
            {
                name: 'Rent with 1 house',
                value: 'whatever'
            },
            {
                name: 'Rent with 2 houses',
                value: 'whatever'
            },
            {
                name: 'Rent with 3 houses',
                value: 'whatever'
            },
            {
                name: 'Rent with 4 houses',
                value: 'whatever'
            },
            {
                name: 'Rent with hotel',
                value: 'whatever'
            }
        ]);

    return purchaseEmbed;
}

export function createPropertyPromptActionRow(playerHasMoney: boolean) {
    const buyPropertyButton = new ButtonBuilder()
        .setCustomId('buyProperty')
        .setLabel('Buy')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!playerHasMoney);

    const inspectPropertyButton = new ButtonBuilder()
        .setCustomId('inspectProperty')
        .setLabel('See Property Details')
        .setStyle(ButtonStyle.Primary)

    return [buyPropertyButton, inspectPropertyButton];
}
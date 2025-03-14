import { ButtonBuilder, ButtonStyle } from "discord.js";
import fs from 'node:fs';
import path from "node:path";
import Property from "../../models/interfaces/Property";

export function getProperties(): Property[] {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'properties.json'), 'utf-8'));
}

export function getPropertyFromId(selectedId: number): Property {
    const properties = getProperties();

    return properties.filter(({ id }: { id: number}) => id === selectedId)[0];
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
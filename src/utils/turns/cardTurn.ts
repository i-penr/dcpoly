import { buildTemplateEmbed } from "../embeds/buildTemplateEmbed";
import { Player } from "../../db/tables/Player";
import { Game } from "../../db/tables/Game";
import { goToJail } from "../actions/goToJail";
import fs from 'node:fs';
import path from "node:path";
import type Card from "../../models/interfaces/Card";
import Client from "../../models/classes/Client";

export async function useCard(player: Player) {
    try {
        const cards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'cards.json'), 'utf-8'));
        const randomCard: Card = cards[Math.floor(Math.random() * cards.length)]!;
        const money = randomCard.money ?? 0;
        const cardEmbed = buildTemplateEmbed()
            .setTitle(randomCard.title)
            .setDescription(randomCard.description)
            .setAuthor({ name: 'Chance card', iconURL: Client.getInstance().user!.avatarURL()! })
            .setColor('Purple');

        if (randomCard.givesJailCard) {
            const newJailCards = player.jailFreeCards + 1;
            await player.update({ jailFreeCards: newJailCards });
            cardEmbed.addFields({
                name: 'Number of Get Out of Jail Cards',
                value: `${newJailCards}`
            });
        }

        if (randomCard.othersInvolved) {
            const playersInGame = (await Game.findOne({ where: { id: player.gameId }, include: Player }))!.players ?? [];

            await player.update({ money: player.money + money * playersInGame.length });

            await Promise.all(playersInGame.map(async (p) => {
                await p.update({ money: p.money + money });
            }));
        }

        if (randomCard.squareRelative) {
            await player.update({ current_square: player.current_square + randomCard.squareRelative });
        }

        if (randomCard.squareAbsolute) {
            await player.update({ current_square: randomCard.squareAbsolute });
        }

        if (randomCard.goesToJail) {
            await goToJail(player);
        }

        if (randomCard.houseMultiplier) {
            // TODO when implementing buildings
        }

        if (randomCard.hotelMultiplier) {
            // TODO when implementing buildings
        }

        if (money !== 0 && !randomCard.othersInvolved) {
            await player.update({ money: player.money + money });
        }

        return cardEmbed;
    } catch (err) {
        console.error('Error using card:', err);
    }
}
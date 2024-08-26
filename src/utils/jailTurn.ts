import { CommandInteraction, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Interaction } from "discord.js";
import { Player } from "../db/tables/Player";

export async function promptJailEmbed(player: Player, interaction: CommandInteraction) {
    const jailedIcon = new AttachmentBuilder('./assets/jailed.png');
    const jailEmbed = new EmbedBuilder()
        .setTitle('You are in `jail`. What do you want to do?')
        .setColor('Orange')
        .setThumbnail('attachment://jailed.png')
        .setDescription(`You have \`${3 - player.get('jailStatus')}\` turns remaining in jail
                         You have \`${player.get('money')}$\`
                         You have \`${player.get('jailFreeCards')}\` "Get Out Of Jail Free" cards.`)
        .setTimestamp();

    const rollDiceButton = new ButtonBuilder()
        .setCustomId('rollDices')
        .setLabel('Roll dices (Doubles = out of jail)')
        .setStyle(ButtonStyle.Primary);

    const payUpButton = new ButtonBuilder()
        .setCustomId('payUp')
        .setLabel('Pay 50$ to get out')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(player.get('money') < 50);

    const getOutOfJailFreeCardButton = new ButtonBuilder()
        .setCustomId('getOutOfJailFreeCard')
        .setLabel('Use "Get Out Of Jail Free" card')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(player.jailFreeCards === 0);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(rollDiceButton, payUpButton, getOutOfJailFreeCardButton);
    return await interaction.reply({ embeds: [jailEmbed], files: [jailedIcon], components: [row] });
}

export async function waitForJailResponse(response: any, interaction: CommandInteraction, player: Player) {
    try {
        const confirmation = await response.awaitMessageComponent({
            filter: (i: Interaction) => i.user.id === interaction.user.id,
            time: 60000,
        });

        switch (confirmation.customId) {
            case 'payUp':
                await player.update({ money: player.get('money') - 50, jailStatus: -1 });
                await confirmation.update({ content: 'Fine payed', components: [] });
            case 'getOutOfJailFreeCard':
                await player.update({ jailFreeCards: player.get('jailFreeCards') - 1, jailStatus: -1 });
                await confirmation.update({ content: '"Get Out Of Jail Free" card used', components: [] });
            case 'rollDices':
                // TODO
        }
    } catch {
        // TODO
    }
}
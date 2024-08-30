import { CommandInteraction, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Interaction, InteractionResponse, ButtonInteraction, WrapBooleanCache, CacheType, Embed } from "discord.js";
import { Player } from "../../db/tables/Player";

export async function promptJailActionAndCheckIfPlays(player: Player, interaction: CommandInteraction, result1: number, result2: number) {
    const jailedIcon = new AttachmentBuilder('./assets/jailed.png');
    const jailEmbed = new EmbedBuilder()
        .setTitle('You are in `jail`. What do you want to do?')
        .setColor('Orange')
        .setThumbnail('attachment://jailed.png')
        .setDescription(`You have \`${player.get('jailStatus')}\` turns remaining in jail
                         You have \`${player.get('money')}$\`
                         You have \`${player.get('jailFreeCards')}\` "Get Out Of Jail Free" cards.`)
        .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.avatarURL()! })
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
    return await waitForJailResponse(await interaction.reply({ embeds: [jailEmbed], files: [jailedIcon], components: [row] }), player, jailEmbed, result1, result2);
}

async function waitForJailResponse(response: InteractionResponse, player: Player, jailEmbed: EmbedBuilder, result1: number, result2: number) {
    let title: string, description: string = 'You are now out of jail';
    let continuesPlaying = true;

    try {
        const confirmation = await response.awaitMessageComponent({
            filter: (i: Interaction) => i.user.id === response.interaction.user.id,
            time: 60000,
        });

        switch (confirmation.customId) {
            case 'payUp':
                await player.update({ money: player.get('money') - 50, jailStatus: -1 });
                title = 'You paid `50$`.';
                break;
            case 'getOutOfJailFreeCard':
                await player.update({ jailFreeCards: player.get('jailFreeCards') - 1, jailStatus: -1 });
                title = 'Get Out Of Jail Free" card used';
                break;
            case 'rollDices': default:
                throw 'DefaultCase';
        }
    } catch {
        title = 'You chose: \`Roll Dices\`';
        description = `You rolled a \`${result1}\` and a \`${result2}\``;

        if (result1 === result2) {
            await player.update({ doubleRollStreak: player.get('doubleRollStreak') + 1 });
            description += '\nYou got doubles! You are free to go!';
        } else {
            const jailStatus = player.get('jailStatus');
            continuesPlaying = false;

            await player.update({ jailStatus: (jailStatus - 1) as -1 | 0 | 1 | 2 | 3 }); // yikes
            description += `\nYou didn\'t roll doubles. You still have \`${jailStatus-1}\` turns left in jail.`;
        }
    } finally {
        jailEmbed.setTitle(title!);
        jailEmbed.setDescription(description);

        await response.edit({ embeds: [jailEmbed], components: [] });

        return continuesPlaying;
    }
}


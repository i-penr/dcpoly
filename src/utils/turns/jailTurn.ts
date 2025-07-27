import { ChatInputCommandInteraction, AttachmentBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { Player } from "../../db/tables/Player";
import DiscordResponse from "../../models/classes/DiscordResponse";
import { createButtonCollector } from "../createButtonCollector";
import { buildTemplateEmbed } from "../embeds/buildTemplateEmbed";

export async function promptJailActionAndCheckIfPlays(player: Player, interaction: ChatInputCommandInteraction, result1: number, result2: number) {
    const jailedIcon = new AttachmentBuilder('./assets/jailed.png');
    const jailEmbed = buildTemplateEmbed()
        .setTitle('You are in `jail`. What do you want to do?')
        .setColor('Orange')
        .setThumbnail('attachment://jailed.png')
        .setDescription(`You have \`${player.jailStatus}\` turns remaining in jail
                         You have \`${player.money}$\`
                         You have \`${player.jailFreeCards}\` "Get Out Of Jail Free" cards.`)
        .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.avatarURL()! })
        .setTimestamp();

    const buttons = [
        {
            id: 'rollDices',
            label: 'Roll dices (Doubles = out of jail)',
            style: ButtonStyle.Primary
        },
        {
            id: 'payUp',
            label: 'Pay 50 to get out',
            style: ButtonStyle.Primary,
            disabled: player.money < 50
        },
        {
            id: 'getOutOfJailFreeCard',
            label: 'Use "Get Out Of Jail Free" card',
            style: ButtonStyle.Primary,
            disabled: player.jailFreeCards === 0
        }
    ]

    const responseBuilder = new DiscordResponse([jailEmbed], [jailedIcon]);
    responseBuilder.addButtons(...buttons)
    responseBuilder.response = await interaction.followUp(responseBuilder.generateResponsePayload());

    return await waitForJailResponse(responseBuilder, player, result1, result2, interaction);
}

async function waitForJailResponse(responseBuilder: DiscordResponse, player: Player, result1: number, result2: number, interaction: ChatInputCommandInteraction) {

    let description = 'You are now out of jail';
    let continuesPlaying = true;

    let title = await handleButtonInteractions(responseBuilder, interaction, player);

    responseBuilder.response?.edit({ components: [] });

    if (!title) {
        title = 'You chose: `Roll Dices`';
        description = `You rolled a \`${result1}\` and a \`${result2}\``;

        if (result1 === result2) {
            await player.update({ doubleRollStreak: player.doubleRollStreak + 1 });
            description += '\nYou got doubles! You are free to go!';
        } else {
            const newJailStatus = player.jailStatus - 1 as -1; // yikes
            continuesPlaying = false;

            await player.update({ jailStatus: newJailStatus });
            description += `\nYou didn't roll doubles. You have \`${newJailStatus + 1}\` turns left in jail.`;
        }
    }

    responseBuilder.embeds[0]!.setTitle(title);
    responseBuilder.embeds[0]!.setDescription(description);
    responseBuilder.actionRow = new ActionRowBuilder<ButtonBuilder>();

    await interaction.followUp(responseBuilder.generateResponsePayload());

    return continuesPlaying;
}

function handleButtonInteractions(responseBuilder: DiscordResponse, interaction: ChatInputCommandInteraction, player: Player): Promise<string> {
    return new Promise((resolve) => {
        const collector = createButtonCollector(responseBuilder.response!, interaction);

        collector?.on('collect', async (b: { customId: string; }) => {
            switch (b.customId) {
                case 'payUp':
                    handlePayUpOption(player)
                    return resolve('You paid `50$`.');
                case 'getOutOfJailFreeCard':
                    handleGetOutOfJailFreeCardOption(player);
                    return resolve('Get Out Of Jail Free" card used');
                case 'rollDices': default:
                    return resolve('')
            }
        });

        collector?.on('end', () => {
            return resolve('')
        });
    });
}

async function handlePayUpOption(player: Player) {
    await player.update({ money: player.money - 50, net_worth: player.net_worth - 50, jailStatus: -1 });
}

async function handleGetOutOfJailFreeCardOption(player: Player) {
    await player.update({ jailFreeCards: player.jailFreeCards - 1, jailStatus: -1 });
}

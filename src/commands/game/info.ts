import { CommandInteraction, SlashCommandBuilder, User } from 'discord.js';
import Command from '../../models/interfaces/Command';
import { getGameFromGuildWithStatus } from '../../utils/database';
import { buildErrorEmbed } from '../../utils/buildErrorEmbedResponse';
import { Player } from '../../db/tables/Player';
import { buildTemplateEmbed } from '../../utils/buildTemplateEmbed';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows information about a player in the game.')
        .addUserOption(option =>
            option.setName('player')
                .setDescription('The name of the player you want to see.')
        ),
    async execute(interaction: CommandInteraction) {
        const game = await getGameFromGuildWithStatus(interaction.guildId!, 'active');

        if (!game) {
            interaction.reply(buildErrorEmbed(interaction, 'There are no current active games on the server.'));
            return;
        }

        const players = game.get('players') ?? [];
        const chosenUser: User = interaction.options.getUser('player') ?? interaction.user;
        const chosenPlayer = players.find((p) => p.get('userId') === chosenUser.id);

        if (!chosenPlayer) {
            interaction.reply({ ...buildErrorEmbed(interaction, `User ${chosenUser} is not a player in the game.`), ephemeral: true });
            return;
        }

        const playerEmbed = buildInfoEmbed(chosenPlayer, interaction, players);

        interaction.reply({ embeds: [playerEmbed] });
    },
}

function buildInfoEmbed(player: Player, interaction: CommandInteraction, players: Player[]) {
    const infoEmbed = buildTemplateEmbed()
            .setTitle(`${interaction.user.username}'s info`)
            .setThumbnail(interaction.user.avatarURL())
            .addFields(
                {
                    name: 'Game Ranking',
                    value: getPlayerRanking(players!, player),
                    inline: true
                },
                {
                    name: 'Money',
                    value: `${player.get('money').toLocaleString()}$`,
                    inline: true
                },
                {
                    name: 'Current Square',
                    value: `${player.get('current_square')}`
                },
                {
                    name: 'Owned Properties',
                    value: 'TODO',
                    inline: true
                },
                {
                    name: 'Colors Owned',
                    value: 'TODO',
                    inline: true
                },
                {
                    name: '"Get Out of Jail Free" Cards',
                    value: `${player.get('jailFreeCards')}`
                }
            );
    return infoEmbed
}

function getPlayerRanking(playerList: Player[], player: Player): string {
    const moneySortedPlayers = playerList.sort((a, b) => {
        return a.money > b.money ? 1 : -1;
    });

    const playerPosition = moneySortedPlayers.findIndex((p) => p.get('userId') === player.get('userId'));

    return ordinal(playerPosition)
}

function ordinal(n: number) {
    var s = ["th", "st", "nd", "rd"];
    var v = n%100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
}  

export { command };
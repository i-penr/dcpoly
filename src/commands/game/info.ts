import { CommandInteraction, EmbedBuilder, SlashCommandBuilder, User } from 'discord.js';
import Command from '../../models/interfaces/Command';
import { getGameFromGuildWithStatus } from '../../utils/database';
import { buildErrorEmbed } from '../../utils/buildErrorEmbedResponse';
import { Player } from '../../db/tables/Player';

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

        const players = game.get('players');
        const chosenUser: User = interaction.options.getUser('player') ?? interaction.user;
        const chosenPlayer = players?.find((p) => p.get('userId') === chosenUser.id);

        if (!chosenPlayer) {
            interaction.reply({ ...buildErrorEmbed(interaction, `User ${chosenUser} is not a player in the game.`), ephemeral: true });
            return;
        }

        const playerEmbed = new EmbedBuilder()
            .setTitle(`${chosenUser.username}'s info`)
            .setColor('Blue')
            .addFields(
                {
                    name: 'Game Ranking',
                    value: getPlayerRanking(players!, chosenPlayer),
                    inline: true
                },
                {
                    name: 'Money',
                    value: `${chosenPlayer.get('money').toLocaleString()}$`,
                    inline: true
                },
                {
                    name: 'Current Square',
                    value: `${chosenPlayer.get('current_square')}`
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
                    value: `${chosenPlayer.get('jailFreeCards')}`
                }
            )
            .setThumbnail(chosenUser.avatarURL())
            .setTimestamp();

        interaction.reply({ embeds: [playerEmbed] });
    },
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
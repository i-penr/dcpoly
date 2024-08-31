import { CommandInteraction, EmbedBuilder, SlashCommandBuilder, User} from 'discord.js';
import Command from '../../models/interfaces/Command';
import { getGameFromGuildWithStatus } from '../../utils/database';
import { buildErrorEmbed } from '../../utils/buildErrorEmbedResponse';

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
        const chosenPlayer = players?.find((p) => p.get('userId') === chosenUser.id );

        if (!chosenPlayer) {
            interaction.reply({ ...buildErrorEmbed(interaction, `User ${chosenUser} is not a player in the game.`), ephemeral: true });
            return;
        }

        const playerEmbed = new EmbedBuilder()
            .setTitle(`${chosenUser.username}'s info`)
            .setColor('Blue')
            .setThumbnail(chosenUser.avatarURL())
            .setTimestamp();

        interaction.reply({ embeds: [playerEmbed] });     
    },
}

export  { command };
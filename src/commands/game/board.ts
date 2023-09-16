import { AttachmentBuilder, CommandInteraction, EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import Command from '../../models/interfaces/Command';
import path from 'node:path';

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('board')
            .setDescription('Shows the board.'),
    async execute(interaction: CommandInteraction) {
        const boardImg = new AttachmentBuilder(path.join(__dirname, '..', '..', '..', 'assets', 'board.png'));
        const boardEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(`${interaction.guild?.name}'s board`)
            .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.avatarURL()! })
            .setDescription('desc.')
            .setThumbnail(interaction.guild?.iconURL()!)
            .setImage('attachment://board.png')
            .setFooter({ text: 'not monop**y',  iconURL: interaction.client.user.avatarURL()! })
            .setTimestamp();
        
        interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
    },
}

export  { command };
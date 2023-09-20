import { CommandInteraction, SlashCommandBuilder} from "discord.js";
import Command from '../../models/interfaces/Command';
import { buildBoardEmbed } from "../../utils/buildBoardEmbed";
import { drawBoard } from "../../utils/drawBoard";

const command: Command = {
    data: new SlashCommandBuilder()
            .setName('roll')
            .setDescription('Rolls the dice!'),
    async execute(interaction: CommandInteraction) {
        const result1 = Math.floor(Math.random() * 6) + 1;
        const result2 = Math.floor(Math.random() * 6) + 1;
        const boardImg = await drawBoard();

        const boardEmbed = buildBoardEmbed(interaction)
            .setTitle(`${interaction.user.username}'s roll`)
            .setDescription(`You rolled a **${result1}** and a **${result2}**`);

        interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
    },
}

export  { command };
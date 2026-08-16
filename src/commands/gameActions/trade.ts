import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { buildBoardEmbed } from '../../utils/embeds/buildBoardEmbed';
import { drawBoard } from '../../utils/drawBoard';
import { Player } from '../../db/tables/Player';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';
import { getProperties, getPropertyFromId } from '../../utils/actions/propertyActions';
import type Property from '../../models/interfaces/Property';
import { PropertyGame } from '../../db/tables/PropertyGame';
import { getPropertyInGameIfPlayerOwnsIt } from '../../utils/ownedPropertyOperations';

const properties = getProperties();

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Trade money and properties with other players')
    .addUserOption((option) =>
      option.setName('player').setDescription('The name of the player you want to trade with.')
        .setRequired(true)
    )
    .addIntegerOption((option) => {
      option
        .setName('property-offered')
        .setDescription('The property (owned by you) that you want to offer in the trade')

      properties.forEach((property: Property) => {
        option.addChoices({ name: property.name, value: property.id });
      });

      return option;
    })
    .addIntegerOption((option) =>
      option
        .setName('money-offered')
        .setDescription('The money that you want to offer in the trade')
        .setMinValue(0)
    )
    .addIntegerOption((option) => {
      option
        .setName('property-requested')
        .setDescription('The property (owned by the recipient) that you want to request in the trade')

      properties.forEach((property: Property) => {
        option.addChoices({ name: property.name, value: property.id });
      });

      return option;
    })
    .addIntegerOption((option) =>
      option
        .setName('money-requested')
        .setDescription('The money that you want to request in the trade')
        .setMinValue(0)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const game = await getCurrentGameOrFail(interaction.guildId!);
      const recipient = interaction.options.getUser('player')!;

      const propertyOfferedId = interaction.options.getInteger('property-offered');
      const propertyOffered = propertyOfferedId ? getPropertyFromId(propertyOfferedId) : null;
      const propertyOfferedInGame = propertyOffered ? await getPropertyInGameIfPlayerOwnsIt(game, propertyOffered, interaction.user.id) : null;

      const moneyOffered = interaction.options.getInteger('money-offered') ?? 0;
      const moneyRequested = interaction.options.getInteger('money-requested') ?? 0;

      const propertyRequestedId = interaction.options.getInteger('property-requested');
      const propertyRequested = propertyRequestedId ? getPropertyFromId(propertyRequestedId) : null;
      const propertyRequestedInGame = propertyRequested ? await getPropertyInGameIfPlayerOwnsIt(game, propertyRequested, recipient.id) : null;


      const boardImg = await drawBoard(game.players ?? []);
      const boardEmbed = buildBoardEmbed()
        .setThumbnail(interaction.guild?.iconURL() ?? '')
        .setTitle(`${interaction.guild?.name}'s board - Game #${game.get('id')}`)
        .setDescription(getPlayerPositionString(game.players ?? []));

      interaction.reply({ embeds: [boardEmbed], files: [boardImg] });
    } catch (error: unknown) {
      handleCommandError(interaction, error as Error);
    }
  },
};

function getPlayerPositionString(players: Player[]) {
  let playerPositions = '';

  for (const player of players) {
    playerPositions += `- <@${player.userId}> is at square \`${player.current_square}\`\n`;
  }

  return playerPositions || 'No players.';
}

export { command };

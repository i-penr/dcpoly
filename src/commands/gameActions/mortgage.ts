import {
  type ColorResolvable,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { getProperties, getPropertyFromId } from '../../utils/actions/propertyActions';
import type Property from '../../models/interfaces/Property';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';
import { PropertyGame } from '../../db/tables/PropertyGame';
import { Op } from 'sequelize';
import { buildConfirmationResponse, getPropertyInGameIfPlayerOwnsIt, promptOperation } from '../../utils/ownedPropertyOperations';
import { Player } from '../../db/tables/Player';
import { Game } from '../../db/tables/Game';

const properties = getProperties();

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('mortgage')
    .setDescription('Mortgage one of your properties (only if its color has no buildings)')
    .addIntegerOption((option) => {
      option
        .setName('property-name')
        .setDescription('The property (owned by you) that you want to mortgage.')
        .setRequired(true);

      properties.forEach((property: Property) => {
        option.addChoices({ name: property.name, value: property.id });
      });

      return option;
    }),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const game = await getCurrentGameOrFail(interaction.guildId!);
      const selectedPropertyId = interaction.options.getInteger('property-name')!;
      const selectedProperty = getPropertyFromId(selectedPropertyId);
      const propertyInGame = await getPropertyInGameIfPlayerOwnsIt(game, selectedProperty, interaction.user.id);

      await validateOperationConditions(propertyInGame, selectedProperty, game);

      const responseBuilder = buildConfirmationResponse(
        selectedProperty, interaction, 'mortgage', 
        `You are going to **mortgage** property \`${selectedProperty.name}\`. It will give you \`${selectedProperty.mortgage}\` \
        \n\nYour property will be flagged as \`mortgaged\`, so **no rent will be collected from it** \
        \n\nTo unmortgage this property, you will need to pay \`${selectedProperty.mortgage * 1.1}\` \
        \n \
        \nDo you confirm the operation?`
      );

      const willBuild = await promptOperation(responseBuilder, interaction);

      if (!willBuild) {
        interaction.followUp('Operation cancelled.');
        return;
      }

      await mortgageProperty(propertyInGame, propertyInGame.owner!, selectedProperty.mortgage);

      interaction.followUp(
        `You have **mortgaged** \`${selectedProperty.name}\`. You've earned \`${selectedProperty.mortgage}\` \
        \n \
        \nNo rent will be collected from this property.\
        \n \
        \nTo unmortgage this property, run \`/unmortgage\`. The unmortgage cost will be \`${selectedProperty.mortgage * 1.1}\`
        \nYou now have \`${propertyInGame.owner?.money}\`.`
      );
    } catch (error: unknown) {
      handleCommandError(interaction, error as Error);
    }
  },
};

async function validateOperationConditions(
  propertyInGame: PropertyGame,
  selectedProperty: Property,
  game: Game
) {
  if (propertyInGame.mortgaged) {
    throw new Error(
      `Property ${selectedProperty.name} is already mortgaged. Run \`/unmortgage\` to unmortgage it for \`${selectedProperty.mortgage * 1.1}\``,
    );
  }

  if (await buildingsExistInColor(selectedProperty.color, game.id)) {
    throw new Error(
      `You cannot mortgage the property \`${selectedProperty.name}\` because there are buildings present in color \`${selectedProperty.color}\``,
    );
  }
}

async function buildingsExistInColor(color: ColorResolvable, gameId: number) {
  const propertiesInColor = getProperties()
    .filter((p) => (p.color === color))
    .map((p) => p.id);
  const propertiesInColorInGame = await PropertyGame.findAll({
    where: { gameId: gameId, id: { [Op.in]: propertiesInColor } },
  });

  return propertiesInColorInGame.some((p) => p.numBuildings > 0);
}

async function mortgageProperty(property: PropertyGame, player: Player, mortgageMoney: number) {
  await property.update({ mortgaged: true });
  await player.update({ money: player.money + mortgageMoney });
}

export { command };

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { getProperties, getPropertyFromId } from '../../utils/actions/propertyActions';
import type Property from '../../models/interfaces/Property';
import { getCurrentGameOrFail, handleCommandError } from '../../utils/validations';
import { PropertyGame } from '../../db/tables/PropertyGame';
import { buildConfirmationResponse, getPropertyInGameIfPlayerOwnsIt, promptOperation } from '../../utils/ownedPropertyOperations';
import { Player } from '../../db/tables/Player';

const properties = getProperties();

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('unmortgage')
    .setDescription('Unmortgage one of your properties (only if its color has no buildings)')
    .addIntegerOption((option) => {
      option
        .setName('property-name')
        .setDescription('The mortgaged property (owned by you) that you want to unmortgage.')
        .setRequired(true);

      properties.forEach((property: Property) => {
        option.addChoices({ name: property.name, value: property.id });
      });

      return option;
    }),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const game = await getCurrentGameOrFail(interaction.guildId!);
      const player = await Player.findOne({ where: { gameId: game.id, userId: interaction.user.id }});
      const selectedPropertyId = interaction.options.getInteger('property-name')!;
      const selectedProperty = getPropertyFromId(selectedPropertyId);
      const propertyInGame = await getPropertyInGameIfPlayerOwnsIt(game, selectedProperty, interaction.user.id);

      await validateOperationConditions(propertyInGame, selectedProperty);

      const responseBuilder = buildConfirmationResponse(
        selectedProperty, interaction, 'unmortgage',
        `You are going to **unmortgage** property \`${selectedProperty.name}\`. It will cost you \`${selectedProperty.mortgage * 1.1}\` \
         \n\nYour property will no longer be mortgaged, so **it will resume collecting rent**. 
         \n\nMortgaging this property again will give you \`${selectedProperty.mortgage}\` 
         \n 
         \n\nCurrent Money: \`${player!.money}\
         \nDo you want to confirm the operation?`
      );
      const willBuild = await promptOperation(responseBuilder, interaction);

      if (!willBuild) {
        interaction.followUp('Operation cancelled.');
        return;
      }

      unmortgageProperty(propertyInGame, propertyInGame.owner!, selectedProperty.mortgage);

      interaction.followUp(`
        You have **unmortgaged** \`${selectedProperty.name}\`. You've paid \`${selectedProperty.mortgage * 1.1}\` \
        \n \
        \nProperty \`${selectedProperty.name}\` is collecting rent again.\
        \n \
        \nTo unmortgage this property, run \`/unmortgage\`. The unmortgage cost will be \`${selectedProperty.mortgage * 1.1}\`
        \nYou now have \`${propertyInGame.owner?.money}\`.`);
    } catch (error: unknown) {
      handleCommandError(interaction, error as Error);
    }
  },
};

async function validateOperationConditions(
  propertyInGame: PropertyGame,
  selectedProperty: Property,
) {
  if (!propertyInGame.mortgaged) {
    throw new Error(
      `Property ${selectedProperty.name} is not mortgaged. Run \`/mortgage\` to mortgage it for \`${selectedProperty.mortgage}\``,
    );
  }

  if (propertyInGame.owner!.money < selectedProperty.mortgage * 1.1) {
    throw new Error(`
            You don't have enough money (\`${propertyInGame.owner!.money}\`) to unmortgage property \`${selectedProperty.name}\`\
            (unmortgage cost: \`${selectedProperty.mortgage * 1.1}\`).\
            \n\n \
            Try selling buildings or mortgaging other properties to earn money.`);
  }
}

async function unmortgageProperty(property: PropertyGame, player: Player, mortgageMoney: number) {
  await property.update({ mortgaged: false });
  await player.update({
    money: player.money - mortgageMoney * 1.1,
    net_worth: player.net_worth - mortgageMoney * 0.1,
  });
}

export { command };

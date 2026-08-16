import {
  SlashCommandBuilder,
  ChatInputCommandInteraction
} from 'discord.js';
import type Command from '../../models/interfaces/Command';
import { getProperties, getPropertyFromId } from '../../utils/actions/propertyActions';
import type Property from '../../models/interfaces/Property';
import { getCurrentGameOrFail, handleCommandError, userOwnsAllColorInGame } from '../../utils/validations';
import { PropertyGame } from '../../db/tables/PropertyGame';
import { Player } from '../../db/tables/Player';
import { buildConfirmationResponse, canBuildInPropertyInColor, getPropertyInGameIfPlayerOwnsIt, promptOperation } from '../../utils/ownedPropertyOperations';
import { Game } from '../../db/tables/Game';

const properties = getProperties();

type ValidBuildingNumber = 0 | 1 | 2 | 3 | 4 | 5;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('build')
    .setDescription('Build a house or hotel in one of your properties')
    .addIntegerOption((option) => {
      option
        .setName('property-name')
        .setDescription('The property (owned by you) where you want to build.')
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
      const finalNumBuildings = propertyInGame.numBuildings + 1;
      const buildsHotel = finalNumBuildings === 5;

      await validateOperationConditions(selectedProperty, game, interaction, propertyInGame);

      const responseBuilder = buildConfirmationResponse(
        selectedProperty, interaction, 'build',
        `You want to build a house in \`${selectedProperty.name}\`
        \nYour property will have ${buildsHotel ? '1 hotel' : `${finalNumBuildings} house${buildsHotel ? '' : 's'}`}
        \n \
        \nYou will need to pay \`${selectedProperty.buildingCost}\
        \nDo you want to confirm the operation?`
      );

      const willBuild = await promptOperation(responseBuilder, interaction);

      if (!willBuild) {
        interaction.followUp('Operation cancelled.');
        return;
      }

      const player = propertyInGame.owner;

      await buyBuildings(player!, propertyInGame, selectedProperty.buildingCost);

      interaction.followUp(
        `You now own ${propertyInGame.numBuildings === 5 ? 'a hotel' : `${propertyInGame.numBuildings} houses`} in \`${selectedProperty.name}\` for \`${selectedProperty.buildingCost}\`. \
        \n \
        \nRent for \`${selectedProperty.name}\` has risen to \`${selectedProperty.rentProg[propertyInGame.numBuildings]}\`.\
        \n \
        \nYou now have \`${propertyInGame.owner?.money}\`.
      `);
    } catch (error: unknown) {
      handleCommandError(interaction, error as Error);
    }
  },
};

async function validateOperationConditions(
  selectedProperty: Property,
  game: Game,
  interaction: ChatInputCommandInteraction,
  propertyInGame: PropertyGame
) {
  if (!(await userOwnsAllColorInGame(selectedProperty.color, game.id, interaction.user.id))) {
    throw new Error(
      `You cannot build in color ${selectedProperty.color}. You need to **own all properties in that color** first!`,
    );
  }

  if (!(await canBuildInPropertyInColor(propertyInGame, selectedProperty.color, game))) {
    throw new Error(
      `You cannot build here, you need to build evenly on the other properties inside the same color.`
    )
  }

  if (propertyInGame.numBuildings === 5) {
    throw new Error(
      `There is already a hotel in ${selectedProperty.name}. You cannot build anything else here.`
    )
  }
}

async function buyBuildings(
  buyer: Player,
  propertyGame: PropertyGame,
  cost: number,
) {
  const userMoneyLeft = buyer.money - cost;

  if (userMoneyLeft < 0)
    throw new Error(`User does not have enough money:\nMoney Left: \`${buyer.money}\``);

  await propertyGame.update({ numBuildings: propertyGame.numBuildings + 1 as ValidBuildingNumber });
  await buyer.update({ money: userMoneyLeft, net_worth: buyer.net_worth + cost / 2 });
}

export { command };

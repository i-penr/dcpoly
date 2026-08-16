import {
  AttachmentBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  type ColorResolvable,
} from 'discord.js';
import { Game } from '../db/tables/Game';
import { PropertyGame } from '../db/tables/PropertyGame';
import { getProperties } from './actions/propertyActions';
import DiscordResponse, { type ButtonData } from '../models/classes/DiscordResponse';
import { createButtonCollector } from './createButtonCollector';
import { Player } from '../db/tables/Player';
import type Property from '../models/interfaces/Property';
import { buildTemplateEmbed } from './embeds/buildTemplateEmbed';

export async function getPropertyInGameIfPlayerOwnsIt(game: Game, property: Property, playerId: string) {
  const propertyInGame = await PropertyGame.findOne({
    where: { gameId: game.id, ownerId: playerId, id: property.id },
    include: { model: Player, as: 'owner' },
  });

  if (!propertyInGame) {
    throw new Error(
      `Sorry! You don't own property \`${property.name}\` in the current game (game #${game.id})`,
    );
  }

  return propertyInGame;
}

export function setUpConfirmationButtons(): ButtonData[] {
  return [
    { id: 'confirmBuild', label: 'Yes', style: ButtonStyle.Success },
    { id: 'cancelBuild', label: 'No', style: ButtonStyle.Danger },
  ];
}

export async function promptOperation(responseBuilder: DiscordResponse, interaction: ChatInputCommandInteraction,) {
  responseBuilder.addButtons(...setUpConfirmationButtons());
  responseBuilder.response = await interaction.reply(responseBuilder.generateResponsePayload());
  const willBuild = await handleButtonInteractions(responseBuilder, interaction);
  responseBuilder.response.edit({ components: [] });

  return willBuild;
}

export async function canBuildInPropertyInColor(property: PropertyGame, color: ColorResolvable, game: Game) {
  const propertiesInColor = getProperties().filter((p) => (p.color === color && p.id !== property.id)).map((p) => p.id);
  const numBuildingsInColor = (await PropertyGame.findAll({ where: { id: propertiesInColor, gameId: game.id } })).map((p) => p.numBuildings);

  return numBuildingsInColor.every((numBuilding) => property.numBuildings <= numBuilding);
}

export async function canSellInPropertyInColor(property: PropertyGame, color: ColorResolvable, game: Game) {
  const propertiesInColor = getProperties().filter((p) => (p.color === color && p.id !== property.id)).map((p) => p.id);
  const numBuildingsInColor = (await PropertyGame.findAll({ where: { id: propertiesInColor, gameId: game.id } })).map((p) => p.numBuildings);

  return numBuildingsInColor.every((numBuilding) => property.numBuildings >= numBuilding);
}

function handleButtonInteractions(
  responseBuilder: DiscordResponse,
  interaction: ChatInputCommandInteraction,
) {
  return new Promise((resolve) => {
    const collector = createButtonCollector(responseBuilder.response!, interaction);

    collector?.on('collect', async (b: { customId: string }) => {
      try {
        switch (b.customId) {
          case 'confirmBuild':
            return resolve(true);
          case 'cancelBuild':
          default:
            throw 'Turn Ended';
        }
      } catch {
        collector.stop();
        return resolve(false);
      }
    });

    collector?.on('end', () => {
      return resolve(false);
    });
  });
}

export function buildConfirmationResponse(
  selectedProperty: Property,
  interaction: ChatInputCommandInteraction,
  action: string,
  description: string
) {
  const icon = new AttachmentBuilder(`./assets/${action}.jpg`);
  const confirmationEmbed = buildTemplateEmbed()
    .setTitle(`${action.charAt(0).toUpperCase() + action.slice(1)} operation summary in \`${selectedProperty.name}\``)
    .setDescription(description)
    .setColor(selectedProperty.color)
    .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.avatarURL()! })
    .setThumbnail(`attachment://${action}.jpg`);

  const responseBuilder = new DiscordResponse([confirmationEmbed], [icon]);
  return responseBuilder;
}

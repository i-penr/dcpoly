import { jest, spyOn } from "bun:test";
import { Collection, ChatInputCommandInteraction, Guild, User, CommandInteractionOptionResolver, MessagePayload, type InteractionReplyOptions } from "discord.js";
import type Command from "../models/interfaces/Command";
import path from "path";
import fs from 'fs';
import Client from "../models/classes/Client";

const client = Client.getInstance();

export default class MockDiscord {
  private client!: Client;
  private user!: User;
  public interaction!: ChatInputCommandInteraction;
  public guild!: Guild;

  constructor(command: string, options?: CommandInteractionOptionResolver) {
    this.mockClient();
    this.mockGuild();
    this.mockUser();
    this.mockInteraction(command, options);
  }

  public async init(): Promise<void> {
    await this.mockCommands();
  }

  public getInteraction(): ChatInputCommandInteraction {
    return this.interaction;
  }

  public getCommands(): Collection<string, Command> {
    return client.commands;
  }

  private mockClient(): void {
    this.client = client;
    this.client.user = Reflect.construct(User, [
      this.client, {
        id: "client-id",
        username: "test-bot",
        discriminator: "test-bot#0001",
        avatar: "avatar",
        bot: "true",
        displayName: "testBot",
        avatarURL: "avatarURL"
      }
    ]);
  }

  private mockGuild(): void {
    this.guild = Reflect.construct(Guild, [
      this.client, {
        unavailable: false,
        id: 'guildId',
        name: 'mocked guild'
      }
    ]);
    this.guild.iconURL = () => 'http://icon-url.com/icon.png';
  }

  private mockUser(): void {
    this.user = Reflect.construct(User, [
      this.client, {
        id: process.env.AUTHOR_ID!,
        username: "test-user",
        discriminator: "test-user#0000",
        avatar: "avatar",
        bot: false,
        displayName: "testUser",
        avatarURL: "avatarURL",
      }
    ]);
    this.client.users.cache.set(this.user.id, this.user);
    this.user.displayAvatarURL = () => 'https://cdn.discordapp.com/embed/avatars/0.png'
  }

  private mockInteraction(command: string, options?: CommandInteractionOptionResolver): void {
    if (!command) return;

    this.interaction = Reflect.construct(ChatInputCommandInteraction, [
      this.client, {
        data: command,
        id: BigInt(1),
        user: this.user,
      }
    ]);
    this.interaction.guildId = this.guild.id;
    // Use Object.defineProperty to mock the read-only 'guild' property
    Object.defineProperty(this.interaction, 'guild', {
      get: () => this.guild,
    });
    this.interaction.commandName = command;
    this.interaction.reply = jest.fn();
    if (options) this.interaction.options = options;
    this.interaction.deferReply = jest.fn();
  }

  private async mockCommands(): Promise<void> {
    const foldersPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    const importPromises: Promise<void>[] = [];

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs.readdirSync(commandsPath);

      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);

        const importPromise = import(filePath).then(({ command }) => {
          if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
          } else {
            console.warn(`[WARNING] Invalid command structure in ${file}`);
          }
        }).catch(err => {
          console.error(`[ERROR] Failed to load command at ${filePath}:`, err);
        });

        importPromises.push(importPromise);
      }
    }

    await Promise.all(importPromises); // ✅ Ensure all commands are loaded before continuing
  }
}

export async function mockInteractionAndSpyReply(command: string, options?: CommandInteractionOptionResolver) {
  const discord = new MockDiscord(command, options);
  const interaction = discord.getInteraction() as ChatInputCommandInteraction;
  await discord.init();

  const spy = spyOn(interaction, 'reply') as unknown as (
    message: string | MessagePayload | InteractionReplyOptions
  ) => Promise<void>;

  const commands = discord.getCommands();
  await commands.get(command)?.execute(interaction);

  return spy;
}

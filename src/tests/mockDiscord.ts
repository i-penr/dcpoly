import { jest, spyOn } from "bun:test";
import { Collection, CommandInteraction, Guild, User } from "discord.js";
import Command from "../models/interfaces/Command";
import path from "path";
import fs from 'fs';
import Client from "../models/classes/Client";

const client = Client.getInstance();

export default class MockDiscord {
  private client!: Client;
  private user!: User;
  public interaction!: CommandInteraction;
  public guild!: Guild;

  constructor(command: string, options: { getUser: () => User }) {
    this.mockClient();
    this.mockGuild();
    this.mockUser();
    this.mockInteraction(command, options);
    this.mockCommands();
  }

  public getInteraction(): CommandInteraction {
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
        id: process.env.AUTHOR_ID,
        username: "test-user",
        discriminator: "test-user#0000",
        avatar: "avatar",
        bot: false,
        displayName: "testUser",
        avatarURL: "avatarURL"
      }
    ]);
    this.client.users.cache.set(this.user.id, this.user);
  }

  private mockInteraction(command: string, options: any): void {
    if (!command) return;

    this.interaction = Reflect.construct(CommandInteraction, [
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
    this.interaction.options = options;
    this.interaction.deferReply = jest.fn();
  }

  private mockCommands() {
    const foldersPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs.readdirSync(commandsPath);

      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const { command } = require(filePath);

        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
        } else {
          console.log(command)
          console.log(`[WARNING] The command '${file}' is not well formed.`);
        }
      }
    }
  }
}

export async function mockInteractionAndSpyReply(command: string, options?: any) {
  const discord = new MockDiscord(command, options);
  const interaction = discord.getInteraction() as CommandInteraction;

  const spy = spyOn(interaction, 'reply')
  const commands = discord.getCommands();

  await commands.get(command)?.execute(interaction);

  return spy;
}

import { jest, spyOn } from "bun:test";
import { Client, Collection, CommandInteraction, User } from "discord.js";
import Command from "../models/interfaces/Command";
import path from "path";
import fs from 'fs';

export default class MockDiscord {
  private client!: Client;
  private user!: User;
  public interaction!: CommandInteraction;
  public commands!: Collection<string, Command>;

  constructor(options: any) {
    this.mockClient();
    this.mockUser();
    this.mockInteraction(options?.command);
    this.mockCommands();
  }

  public getInteraction(): CommandInteraction {
    return this.interaction;
  }

  public getCommands(): Collection<string, Command> {
    return this.commands;
  }

  private mockClient(): void {
    this.client = new Client({ intents: [] });
    this.client.login = jest.fn(() => Promise.resolve(process.env.TOKEN!));
  }

  private mockUser(): void {
    this.user = Reflect.construct(User, [
      this.client, {
        id: "user-id",
        username: "test-user",
        discriminator: "test-user#0000",
        avatar: "avatar",
        bot: "false"
      }
    ])
  }

  private mockInteraction(command: any): void {
    this.interaction = Reflect.construct(CommandInteraction, [
      this.client, {
        data: command,
        id: BigInt(1),
        user: this.user
      }
    ]);
    this.interaction.reply = jest.fn();
  }

  private mockCommands() {
    this.commands = new Collection<string, Command>();

    const foldersPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs.readdirSync(commandsPath);

      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const { command } = require(filePath);

        if ('data' in command && 'execute' in command) {
          this.commands.set(command.data.name, command);
        } else {
          console.log(command)
          console.log(`[WARNING] The command '${file}' is not well formed.`);
        }
      }
    }
  }
}

export function mockInteractionAndSpyReply(command: any) {
  const discord = new MockDiscord({ command })
  const interaction = discord.getInteraction() as CommandInteraction
  const spy = spyOn(interaction, 'reply')
  const commands = discord.getCommands();

  commands.get(command)?.execute(interaction);

  return spy;
}

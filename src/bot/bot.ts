import { Client, Intents, Interaction } from 'discord.js';
import { Config } from '../config/config';
import { QuestionCommand } from '../commands/questionCommand';

export class Bot {
  private client: Client;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new Client({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    });

    this.client.on('ready', this.onReady.bind(this));
    this.client.on('interactionCreate', this.onInteraction.bind(this));
  }

  public async start(): Promise<void> {
    await this.client.login(this.config.token);
  }

  private async onReady(): Promise<void> {
    console.log(`Logged in as ${this.client.user?.tag}`);
    
    const guild = await this.client.guilds.fetch(this.config.guildId);
    await guild.commands.set([
      {
        name: 'question',
        description: 'Display a question with clickable buttons',
      },
    ]);
  }

  private async onInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) return;
    if (interaction.channelId !== this.config.channelId) return;

    if (interaction.commandName === 'question') {
      await new QuestionCommand().execute(interaction);
    }
  }
}
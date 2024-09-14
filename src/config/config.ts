import dotenv from 'dotenv';

dotenv.config();

export class Config {
  public readonly token: string;
  public readonly guildId: string;
  public readonly channelId: string;

  constructor() {
    this.token = process.env.DISCORD_TOKEN || '';
    this.guildId = process.env.GUILD_ID || '';
    this.channelId = process.env.CHANNEL_ID || '';

    if (!this.token || !this.guildId || !this.channelId) {
      throw new Error('Missing environment variables');
    }
  }
}
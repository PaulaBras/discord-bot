import dotenv from 'dotenv';

dotenv.config();

export class Config {
  public readonly token: string;
  public readonly guildId: string;
  public readonly channelId: string;
  public readonly mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  constructor() {
    this.token = process.env.DISCORD_TOKEN || '';
    this.guildId = process.env.GUILD_ID || '';
    this.channelId = process.env.CHANNEL_ID || '';

    this.mysql = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'discord_bot_questions',
    };

    if (!this.token || !this.guildId || !this.channelId) {
      throw new Error('Missing environment variables');
    }
  }
}
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Database } from '../database/database';
import { Config } from '../config/config';

export class ScoreboardCommand {
  private database: Database;

  constructor(config: Config) {
    this.database = new Database(config);
  }

  public async execute(interaction: CommandInteraction): Promise<void> {
    try {
      const topScores = await this.database.getTopScoreboard();

      const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Question Master Scoreboard')
        .setDescription('Top 10 Question Masters:')
        .addFields(
          topScores.map((score, index) => ({
            name: `${index + 1}. ${score.username}`,
            value: `Score: ${score.score.toFixed(1)}`,
            inline: true
          }))
        )
        .setTimestamp();

      // Delete previous scoreboard message if it exists
      const messages = await interaction.channel?.messages.fetch({ limit: 10 });
      const oldScoreboard = messages?.find(m => m.author.id === interaction.client.user?.id && m.embeds[0]?.title === 'Question Master Scoreboard');
      if (oldScoreboard) {
        await oldScoreboard.delete();
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in ScoreboardCommand:', error);
      await interaction.reply({ content: 'An error occurred while fetching the scoreboard.', ephemeral: true });
    }
  }
}
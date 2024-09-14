import { CommandInteraction, MessageActionRow, MessageSelectMenu, MessageButton, MessageEmbed } from 'discord.js';
import { Database } from '../database/database';
import { Config } from '../config/config';

export class QuestionCommand {
  private database: Database;

  constructor(config: Config) {
    this.database = new Database(config);
  }

  public async execute(interaction: CommandInteraction): Promise<void> {
    const userId = interaction.user.id;

    try {
      // Check if the user has already answered today's question
      const hasAnswered = await this.database.hasUserAnsweredToday(userId);
      if (hasAnswered) {
        await interaction.reply({ content: "You've already answered today's question!", ephemeral: true });
        return;
      }

      // Fetch today's question
      const question = await this.database.getDailyQuestion();
      if (!question) {
        await interaction.reply({ content: "There's no question available for today.", ephemeral: true });
        return;
      }

      const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Daily Question`)
        .setDescription(question.question_text);

      let row: MessageActionRow;
      let componentType: string;

      if (question.correct_answers.length === 1) {
        // Create buttons for each answer option
        row = new MessageActionRow()
          .addComponents(
            question.answers.map((answer, index) =>
              new MessageButton()
                .setCustomId(`answer_${index}`)
                .setLabel(answer)
                .setStyle('PRIMARY')
            )
          );
        componentType = 'BUTTON';
      } else {
        // Create options from the question's answers for dropdown
        const options = question.answers.map((answer, index) => ({
          label: answer,
          value: index.toString(),
        }));

        row = new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('answer_select')
              .setPlaceholder('Select your answer(s)')
              .setMinValues(1)
              .setMaxValues(options.length)
              .addOptions(options)
          );
        componentType = 'SELECT_MENU';
      }

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

      const filter = (i: any) => i.user.id === interaction.user.id && 
        (componentType === 'SELECT_MENU' ? i.customId === 'answer_select' : i.customId.startsWith('answer_'));
      const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 60000 });

      collector?.on('collect', async (i: any) => {
        let selectedAnswers: string[];
        if (componentType === 'SELECT_MENU') {
          selectedAnswers = i.values.map((value: string) => question.answers[parseInt(value)]);
        } else {
          const selectedIndex = parseInt(i.customId.split('_')[1]);
          selectedAnswers = [question.answers[selectedIndex]];
        }

        await this.database.saveUserAnswers(userId, question.id, selectedAnswers);

        const correctAnswers = question.correct_answers;
        const isCorrect = selectedAnswers.length === correctAnswers.length && 
                          selectedAnswers.every((answer: string) => correctAnswers.includes(answer));

        const responseMessage = isCorrect ? 
          `Correct! Your answer "${selectedAnswers.join(', ')}" is correct.` : 
          `Thanks for your answer. The correct answer was: "${correctAnswers.join(', ')}".`;

        await i.update({ content: responseMessage, components: [] });
      });

      collector?.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: "Time's up! You didn't provide an answer.", ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error in QuestionCommand:', error);
      await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
  }
}
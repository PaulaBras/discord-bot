import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed, User } from 'discord.js';

interface QuestionResult {
  correct: User[];
  incorrect: User[];
}

export class QuestionCommand {
  private static questionResults: Map<number, QuestionResult> = new Map();
  private static currentQuestionNumber = 1;

  public async execute(interaction: CommandInteraction): Promise<void> {
    const questionNumber = QuestionCommand.currentQuestionNumber;

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`Question #${questionNumber}`)
      .setDescription('What is the capital of France?');

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('paris')
          .setLabel('Paris')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('london')
          .setLabel('London')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('berlin')
          .setLabel('Berlin')
          .setStyle('PRIMARY')
      );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const filter = (i: any) => i.user.id === interaction.user.id && 
      (i.customId === 'paris' || i.customId === 'london' || i.customId === 'berlin');
    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 15000 });

    QuestionCommand.questionResults.set(questionNumber, { correct: [], incorrect: [] });

    collector?.on('collect', async (i: any) => {
      const result = QuestionCommand.questionResults.get(questionNumber)!;
      if (i.customId === 'paris') {
        result.correct.push(i.user);
        await i.update({ content: 'Correct! Paris is the capital of France.', components: [], ephemeral: true });
      } else {
        result.incorrect.push(i.user);
        await i.update({ content: 'Sorry, that\'s incorrect. The correct answer is Paris.', components: [], ephemeral: true });
      }
    });

    collector?.on('end', async () => {
      const result = QuestionCommand.questionResults.get(questionNumber)!;
      const summary = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Question #${questionNumber} Results`)
        .addField('Correct Answers', result.correct.length.toString(), true)
        .addField('Incorrect Answers', result.incorrect.length.toString(), true)
        .addField('Correct Users', result.correct.map(user => user.tag).join(', ') || 'None')
        .addField('Incorrect Users', result.incorrect.map(user => user.tag).join(', ') || 'None');

      await interaction.followUp({ embeds: [summary] });
      QuestionCommand.currentQuestionNumber++;
    });
  }
}
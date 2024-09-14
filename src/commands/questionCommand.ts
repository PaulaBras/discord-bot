import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';

export class QuestionCommand {
  public async execute(interaction: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Question')
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

    await interaction.reply({ embeds: [embed], components: [row] });

    const filter = (i: any) => i.customId === 'paris' || i.customId === 'london' || i.customId === 'berlin';
    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 15000 });

    collector?.on('collect', async (i: any) => {
      if (i.customId === 'paris') {
        await i.update({ content: 'Correct! Paris is the capital of France.', components: [] });
      } else {
        await i.update({ content: 'Sorry, that\'s incorrect. The correct answer is Paris.', components: [] });
      }
    });

    collector?.on('end', () => {
      interaction.editReply({ components: [] });
    });
  }
}
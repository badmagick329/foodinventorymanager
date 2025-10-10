import {
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";

/**
 * Ask for confirmation with Yes/No buttons on a message
 * @param message - The message to reply to with confirmation buttons
 * @param confirmationText - The text to display asking for confirmation
 * @param onConfirm - Callback function to execute when user clicks Yes
 * @param onCancel - Optional callback function to execute when user clicks No
 * @param timeout - Optional timeout in milliseconds (default: 60000 = 1 minute)
 */
export const askForConfirmation = async ({
  message,
  confirmationText,
  onConfirm,
  onCancel,
  timeout = 60000,
}: {
  message: Message;
  confirmationText: string;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => Promise<void> | void;
  timeout?: number;
}): Promise<void> => {
  const confirmId = `confirm_yes_${message.id}`;
  const cancelId = `confirm_no_${message.id}`;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(confirmId)
      .setLabel("Yes")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(cancelId)
      .setLabel("No")
      .setStyle(ButtonStyle.Danger)
  );

  // Send the confirmation message
  const reply = await message.reply({
    content: confirmationText,
    components: [row],
  });

  // Create a collector to wait for button clicks
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) =>
      (i.customId === confirmId || i.customId === cancelId) &&
      i.user.id === message.author.id,
    time: timeout,
    max: 1, // Stop after first click
  });

  collector.on("collect", async (interaction) => {
    try {
      if (interaction.customId === confirmId) {
        await interaction.update({
          content: "✅ Confirmed! Processing...",
          components: [],
        });
        await onConfirm();
      } else if (interaction.customId === cancelId) {
        await interaction.update({
          content: "❌ Cancelled.",
          components: [],
        });
        if (onCancel) {
          await onCancel();
        }
      }
    } catch (err) {
      console.error("[discord-bot] Error in confirmation callback:", err);
      await interaction
        .followUp({
          content: "❌ An error occurred while processing your response.",
        })
        .catch(console.error);
    }
  });

  collector.on("end", async (collected) => {
    // If no one clicked within the timeout
    if (collected.size === 0) {
      await reply
        .edit({
          content: "⏱️ Confirmation timed out. Request cancelled.",
          components: [],
        })
        .catch(console.error);
    }
  });
};

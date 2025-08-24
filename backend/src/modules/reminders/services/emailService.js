// Stub email service for sending reminder emails
export async function sendReminderEmail(userId, notification) {
  // TODO: Integrate with real email provider (SMTP, SendGrid, etc.)
  console.log(`Sending reminder email to user ${userId} for appointment ${notification.appointmentId}`);
  return Promise.resolve();
}

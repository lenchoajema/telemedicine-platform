// Stub SMS service for sending reminder SMS
export async function sendReminderSMS(userId, notification) {
  // TODO: Integrate with real SMS gateway (e.g., Twilio)
  console.log(`Sending reminder SMS to user ${userId} for appointment ${notification.appointmentId}`);
  return Promise.resolve();
}

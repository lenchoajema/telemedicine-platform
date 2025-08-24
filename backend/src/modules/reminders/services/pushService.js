// Stub push notification service for sending FCM/APNs notifications
export async function sendPushNotification(userId, notification) {
  // TODO: Integrate with FCM or APNs using UserDevice tokens
  console.log(`Sending push notification to user ${userId} for appointment ${notification.appointmentId}`);
  return Promise.resolve();
}

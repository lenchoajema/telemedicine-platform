import ThreadSubscription from './subscription.model.js';

// POST /api/forums/threads/:threadId/subscribe
export const subscribeThread = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;
    const existing = await ThreadSubscription.findOne({ userId, threadId });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Already subscribed' });
    }
    await ThreadSubscription.create({ userId, threadId });
    return res.json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    console.log('Error subscribing to thread:', err);
    return res.status(500).json({ success: false, message: 'Failed to subscribe' });
  }
};

// DELETE /api/forums/threads/:threadId/subscribe
export const unsubscribeThread = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;
    await ThreadSubscription.deleteOne({ userId, threadId });
    return res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (err) {
    console.log('Error unsubscribing from thread:', err);
    return res.status(500).json({ success: false, message: 'Failed to unsubscribe' });
  }
};

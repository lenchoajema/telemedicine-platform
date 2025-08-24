import ForumLike from './forumLike.model.js';

// POST /api/forums/posts/:postId/like
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    // Check existing like
    const existing = await ForumLike.findOne({ postId, userId });
    if (existing) {
      await ForumLike.deleteOne({ _id: existing._id });
      return res.json({ success: true, data: { liked: false } });
    }
    await ForumLike.create({ postId, userId });
    return res.json({ success: true, data: { liked: true } });
  } catch (err) {
    console.log('Error toggling like:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
};

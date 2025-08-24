import ForumModerator from './forumModerator.model.js';

// GET /api/forums/categories/:categoryId/moderators
export const getModeratorsForCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const mods = await ForumModerator.find({ categoryId }).populate('userId', 'profile.firstName profile.lastName email');
    res.json({ success: true, data: mods });
  } catch (err) {
    console.log('Error fetching moderators:', err);
    res.status(500).json({ success: false, message: 'Failed to load moderators' });
  }
};

// POST /api/forums/categories/:categoryId/moderators
export const assignModerator = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { userId } = req.body;
    const mod = await ForumModerator.create({ userId, categoryId });
    res.status(201).json({ success: true, data: mod });
  } catch (err) {
    console.log('Error assigning moderator:', err);
    res.status(500).json({ success: false, message: 'Failed to assign moderator' });
  }
};

// DELETE /api/forums/categories/:categoryId/moderators/:userId
export const removeModerator = async (req, res) => {
  try {
    const { categoryId, userId } = req.params;
    await ForumModerator.deleteOne({ userId, categoryId });
    res.json({ success: true, message: 'Moderator removed' });
  } catch (err) {
    console.log('Error removing moderator:', err);
    res.status(500).json({ success: false, message: 'Failed to remove moderator' });
  }
};

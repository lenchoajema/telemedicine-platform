import ForumReport from './forumReport.model.js';

// POST /api/forums/posts/:postId/report
export const reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const reporterId = req.user._id;
    const report = await ForumReport.create({ postId, reporterId, reason });
    return res.status(201).json({ success: true, data: report });
  } catch (err) {
    console.log('Error reporting post:', err);
    return res.status(500).json({ success: false, message: 'Failed to report post' });
  }
};

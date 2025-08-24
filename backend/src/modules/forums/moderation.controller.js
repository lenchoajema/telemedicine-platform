import ForumReport from './forumReport.model.js';

// GET /api/forums/reports?status=Pending
export const getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reports = await ForumReport.find(filter)
      .populate({ path: 'postId', select: 'content authorId', populate: { path: 'authorId', select: 'profile.firstName profile.lastName' } })
      .populate('reporterId', 'profile.firstName profile.lastName');
    return res.json({ success: true, data: reports });
  } catch (err) {
    console.log('Error fetching reports:', err);
    return res.status(500).json({ success: false, message: 'Failed to load reports' });
  }
};

// PATCH /api/forums/reports/:reportId
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    const validStatuses = ['Pending', 'Reviewed', 'ActionTaken'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const report = await ForumReport.findByIdAndUpdate(reportId, { status }, { new: true });
    return res.json({ success: true, data: report });
  } catch (err) {
    console.log('Error updating report status:', err);
    return res.status(500).json({ success: false, message: 'Failed to update report' });
  }
};

import ForumThread from './thread.model.js';
import ForumPost from './post.model.js';

// GET threads in a category, paginated
export const getThreadsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const threads = await ForumThread.find({ categoryId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'profile.firstName profile.lastName');
    const total = await ForumThread.countDocuments({ categoryId });
    return res.json({ success: true, data: { threads, pagination: { total, page, pages: Math.ceil(total/limit) } } });
  } catch (err) {
    console.log('Error fetching threads:', err);
    res.status(500).json({ success: false, message: 'Failed to load threads' });
  }
};

// GET single thread with posts
export const getThreadDetail = async (req, res) => {
  try {
    const { threadId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const thread = await ForumThread.findById(threadId)
      .populate('authorId', 'profile.firstName profile.lastName');
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    const posts = await ForumPost.find({ threadId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'profile.firstName profile.lastName');
    const total = await ForumPost.countDocuments({ threadId });
    // increment view count
    thread.views = (thread.views || 0) + 1;
    await thread.save();
    return res.json({ success: true, data: { thread, posts, pagination: { total, page, pages: Math.ceil(total/limit) } } });
  } catch (err) {
    console.log('Error fetching thread detail:', err);
    res.status(500).json({ success: false, message: 'Failed to load thread' });
  }
};

// POST create new thread
export const createThread = async (req, res) => {
  try {
    const { categoryId, title } = req.body;
    const authorId = req.user._id;
    const thread = await ForumThread.create({ categoryId, title, authorId });
    return res.status(201).json({ success: true, data: thread });
  } catch (err) {
    console.log('Error creating thread:', err);
    res.status(500).json({ success: false, message: 'Failed to create thread' });
  }
};

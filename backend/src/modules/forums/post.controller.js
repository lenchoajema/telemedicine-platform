import ForumPost from './post.model.js';

// POST /api/forums/threads/:threadId/posts
export const createPost = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const authorId = req.user._id;
    const post = await ForumPost.create({ threadId, content, authorId });
    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    console.log('Error creating post:', err);
    return res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

// PATCH /api/forums/posts/:postId
export const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    // Only owner or moderator can edit
    if (post.authorId.toString() !== req.user._id.toString() && !req.user.privileges.includes('Access Community Forums')) {
      return res.status(403).json({ success: false, message: 'Insufficient privileges' });
    }
    const updated = await ForumPost.findByIdAndUpdate(postId, { content }, { new: true });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.log('Error editing post:', err);
    return res.status(500).json({ success: false, message: 'Failed to edit post' });
  }
};

// DELETE /api/forums/posts/:postId
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    // Only owner or moderator can delete
    if (post.authorId.toString() !== req.user._id.toString() && !req.user.privileges.includes('Access Community Forums')) {
      return res.status(403).json({ success: false, message: 'Insufficient privileges' });
    }
    await ForumPost.findByIdAndDelete(postId);
    return res.json({ success: true });
  } catch (err) {
    console.log('Error deleting post:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

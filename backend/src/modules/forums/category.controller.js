import ForumCategory from './category.model.js';

// GET /api/forums/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await ForumCategory.find().sort({ name: 1 });
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.log('Error fetching forum categories:', err);
    return res.status(500).json({ success: false, message: 'Failed to load categories' });
  }
};

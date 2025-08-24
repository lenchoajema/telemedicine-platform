import ForumCategory from './category.model.js';

export async function seedForumCategories() {
  try {
    const count = await ForumCategory.countDocuments();
    if (count === 0) {
      const categories = [
        { name: 'General Discussion', description: 'Talk about anything related to health and telemedicine.' },
        { name: 'Technical Support', description: 'Get help with technical issues.' },
        { name: 'Feedback', description: 'Provide feedback and suggestions.' }
      ];
      await ForumCategory.insertMany(categories);
      console.log('✅ Seeded default forum categories');
    }
  } catch (err) {
    console.log('Error seeding forum categories:', err);
  }
}

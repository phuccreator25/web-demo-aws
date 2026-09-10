import Category from '../models/Category.js';
import ImagePost from '../models/ImagePost.js';
import slugify from 'slugify';

const DEFAULT_CATEGORIES = [
  { name: 'Nature & Landscapes', color: '#10b981', icon: 'Trees' },
  { name: 'Architecture & City', color: '#8b5cf6', icon: 'Building' },
  { name: 'Technology & Cyber', color: '#3b82f6', icon: 'Cpu' },
  { name: 'Digital Art & Abstract', color: '#ec4899', icon: 'Palette' },
  { name: 'Travel & Adventure', color: '#f59e0b', icon: 'Compass' },
];

export const seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      const categoryDocs = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        slug: slugify(cat.name, { lower: true, strict: true }),
      }));
      await Category.insertMany(categoryDocs);
      console.log('[Seed] Default categories created successfully');
    }
  } catch (error) {
    console.error('[Seed Error] Failed to seed categories:', error.message);
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();

    // Get count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await ImagePost.countDocuments({ category: cat._id });
        return { ...cat, count };
      })
    );

    res.json({ success: true, data: categoriesWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const category = await Category.create({ name, slug, color: color || '#3b82f6', icon: icon || 'Folder' });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon } = req.body;

    const updates = {};
    if (name) {
      updates.name = name;
      updates.slug = slugify(name, { lower: true, strict: true });
    }
    if (color) updates.color = color;
    if (icon) updates.icon = icon;

    const updatedCategory = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, data: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Unset category reference from images
    await ImagePost.updateMany({ category: id }, { $unset: { category: '' } });
    await Category.findByIdAndDelete(id);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


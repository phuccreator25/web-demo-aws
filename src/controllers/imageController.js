import ImagePost from '../models/ImagePost.js';
import Category from '../models/Category.js';
import Comment from '../models/Comment.js';
import { uploadFileToS3, deleteFileFromS3 } from '../config/s3.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
    }

    const { title, description, categoryId } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Image title is required' });
    }

    // 1. Upload to AWS S3
    console.log(`[S3 Uploading] ${req.file.originalname} (${req.file.size} bytes)...`);
    const { s3Key, s3Url } = await uploadFileToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    console.log(`[S3 Upload Success] S3 URL: ${s3Url}`);

    // 2. Save metadata to MongoDB
    let validCategory = null;
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) validCategory = cat._id;
    }

    const newPost = await ImagePost.create({
      title,
      description: description || '',
      s3Url,
      s3Key,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category: validCategory,
    });

    const populatedPost = await ImagePost.findById(newPost._id).populate('category');

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully to AWS S3 & MongoDB',
      data: populatedPost,
    });
  } catch (error) {
    console.error('[Upload Error]', error);
    res.status(500).json({ success: false, message: `Upload failed: ${error.message}` });
  }
};

export const getImages = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    // Filter by Category (by ID or Slug)
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({ slug: category });
        if (catDoc) query.category = catDoc._id;
      }
    }

    // Filter by search keyword
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const images = await ImagePost.find(query)
      .populate('category')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: images.length, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await ImagePost.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('category');

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const comments = await Comment.find({ imagePost: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...image.toObject(),
        comments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await ImagePost.findById(id);

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // 1. Delete from AWS S3
    if (image.s3Key) {
      console.log(`[S3 Deleting] Key: ${image.s3Key}`);
      await deleteFileFromS3(image.s3Key);
    }

    // 2. Delete comments & image document from MongoDB
    await Comment.deleteMany({ imagePost: id });
    await ImagePost.findByIdAndDelete(id);

    res.json({ success: true, message: 'Image deleted from AWS S3 and database successfully' });
  } catch (error) {
    console.error('[Delete Error]', error);
    res.status(500).json({ success: false, message: `Delete failed: ${error.message}` });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { author, content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const image = await ImagePost.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const newComment = await Comment.create({
      author: author || 'Anonymous Explorer',
      content,
      imagePost: id,
    });

    res.status(201).json({ success: true, data: newComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await ImagePost.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json({ success: true, likes: image.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId } = req.body;

    const image = await ImagePost.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (categoryId !== undefined) {
      if (categoryId === '' || categoryId === null) {
        updates.category = null;
      } else {
        const cat = await Category.findById(categoryId);
        if (cat) updates.category = cat._id;
      }
    }

    // If user uploaded a new image file to replace the old one
    if (req.file) {
      console.log(`[S3 Replacing] Old Key: ${image.s3Key}, New file: ${req.file.originalname}`);
      // Upload new file to S3
      const { s3Key, s3Url } = await uploadFileToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      // Delete old file from S3
      if (image.s3Key) {
        await deleteFileFromS3(image.s3Key);
      }

      updates.s3Key = s3Key;
      updates.s3Url = s3Url;
      updates.originalName = req.file.originalname;
      updates.fileSize = req.file.size;
      updates.mimeType = req.file.mimetype;
    }

    const updatedImage = await ImagePost.findByIdAndUpdate(id, updates, { new: true }).populate('category');

    res.json({
      success: true,
      message: 'Image post updated successfully in MongoDB',
      data: updatedImage,
    });
  } catch (error) {
    console.error('[Update Error]', error);
    res.status(500).json({ success: false, message: `Update failed: ${error.message}` });
  }
};


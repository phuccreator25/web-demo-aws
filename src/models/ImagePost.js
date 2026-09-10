import mongoose from 'mongoose';

const imagePostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Image title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    s3Url: {
      type: String,
      required: [true, 'S3 URL is required'],
    },
    s3Key: {
      type: String,
      required: [true, 'S3 Key is required'],
    },
    originalName: {
      type: String,
    },
    fileSize: {
      type: Number, // in bytes
    },
    mimeType: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ImagePost', imagePostSchema);

import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      default: 'Anonymous Explorer',
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
    },
    imagePost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImagePost',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Comment', commentSchema);

import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    color: {
      type: String,
      default: '#3b82f6', // Tailwind blue-500 default
    },
    icon: {
      type: String,
      default: 'Folder',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);

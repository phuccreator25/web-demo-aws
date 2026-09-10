import express from 'express';
import { upload } from '../middleware/upload.js';
import {
  uploadImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage,
  addComment,
  toggleLike,
} from '../controllers/imageController.js';

const router = express.Router();

router.get('/', getImages);
router.post('/upload', upload.single('image'), uploadImage);
router.get('/:id', getImageById);
router.put('/:id', upload.single('image'), updateImage);
router.delete('/:id', deleteImage);
router.post('/:id/comments', addComment);
router.post('/:id/like', toggleLike);

export default router;

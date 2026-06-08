const path = require('path');

const multer = require('multer');

const AppError = require('../utils/app-error');
const { avatarDirectory, ensureAvatarDirectory } = require('../utils/avatar-storage');

const allowedMimeTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await ensureAvatarDirectory();
      callback(null, avatarDirectory);
    } catch (error) {
      callback(error);
    }
  },
  filename: (req, file, callback) => {
    const extension = allowedMimeTypes.get(file.mimetype) || path.extname(file.originalname).toLowerCase();
    const uniquePart = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    callback(null, `user-${req.user.id}-${uniquePart}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF', 400));
      return;
    }

    callback(null, true);
  },
}).single('avatar');

const avatarUploadMiddleware = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Ảnh đại diện tối đa 3MB'
          : 'Không tải được ảnh đại diện';

      next(new AppError(message, 400));
      return;
    }

    next(error);
  });
};

module.exports = avatarUploadMiddleware;

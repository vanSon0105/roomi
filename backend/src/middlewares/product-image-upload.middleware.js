const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/app-error');

const imageDir = path.resolve(__dirname, '..', '..', '..', 'frontend', 'assets', 'images', 'products');

const ensureDir = () => {
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDir();
    cb(null, imageDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
}).array('images', 6);

const productImageUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Ảnh tối đa 5MB' : err.code === 'LIMIT_FILE_COUNT' ? 'Tối đa 6 ảnh' : 'Lỗi tải ảnh';
      return next(new AppError(msg, 400));
    }
    if (err) return next(err);
    next();
  });
};

module.exports = productImageUpload;

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_BASE = process.env.UPLOAD_PATH || './uploads';

const diskStorage = (subdir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_BASE, subdir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });

const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp, gif)'));
  }
};

const audioFilter = (req, file, cb) => {
  const allowed = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed (mp3, wav, flac, aac, ogg, m4a)'));
  }
};

const MAX = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50 MB

const uploadImage = (subdir) =>
  multer({ storage: diskStorage(`images/${subdir}`), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const uploadAudio = () =>
  multer({ storage: diskStorage('audio'), fileFilter: audioFilter, limits: { fileSize: MAX } });

const uploadSong = () =>
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const isAudio = file.fieldname === 'audio';
        const dir = path.join(UPLOAD_BASE, isAudio ? 'audio' : 'images/albums');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, name);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'audio') return audioFilter(req, file, cb);
      if (file.fieldname === 'cover') return imageFilter(req, file, cb);
      cb(new Error('Unexpected field'));
    },
    limits: { fileSize: MAX },
  });

module.exports = { uploadImage, uploadAudio, uploadSong };

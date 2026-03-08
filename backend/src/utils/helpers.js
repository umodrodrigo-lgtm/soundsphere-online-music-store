const { v4: uuidv4 } = require('uuid');

const generateId = () => uuidv4();

const paginate = (req) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const fileUrl = (req, filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  return `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/').replace(/^\.\//, '')}`;
};

module.exports = { generateId, paginate, paginatedResponse, formatDuration, slugify, fileUrl };

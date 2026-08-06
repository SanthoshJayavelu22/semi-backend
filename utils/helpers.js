const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

// Helper to get base URL
exports.getBaseUrl = (req) => {
  return `${req.protocol}://${req.get('host')}`;
};

// Helper to delete local file
exports.deleteLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper to safely parse JSON or return fallback
exports.parseJSON = (input, fallback = null) => {
  if (!input) return fallback;
  if (typeof input !== 'string') return input; // already parsed
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
};

// Generate a unique slug by appending suffix if needed
exports.generateUniqueSlug = async (model, title, resourceId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await model.findOne({
      slug,
      ...(resourceId ? { _id: { $ne: resourceId } } : {}),
    });
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
};

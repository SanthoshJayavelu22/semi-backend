const fs = require('fs');
const path = require('path');

/**
 * @desc Deletes multiple files from disk safely
 * @param {Array} filePaths - Array of relative file paths
 */
const deleteFiles = (filePaths) => {
  if (!Array.isArray(filePaths)) return;
  
  filePaths.forEach(filePath => {
    if (filePath) {
      const fullPath = path.join(__dirname, '..', filePath);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error(`Error deleting file ${fullPath}:`, err.message);
      }
    }
  });
};

/**
 * @desc Safely deletes a single file
 * @param {string} filePath - Relative file path
 */
const deleteSingleFile = (filePath) => {
  if (!filePath) return;
  deleteFiles([filePath]);
};

module.exports = {
  deleteFiles,
  deleteSingleFile
};

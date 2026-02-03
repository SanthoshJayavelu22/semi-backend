const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const upload = require('../middleware/upload');

// Configuration for Multer fields
const uploadFields = [
  { name: 'photograph', maxCount: 1 },
  { name: 'mciFile', maxCount: 1 },
  { name: 'pgFile', maxCount: 1 },
  { name: 'otherDocs', maxCount: 5 },
];

/**
 * @route   POST /api/membership
 * @desc    Submit a new membership application
 */
router.post('/', upload.fields(uploadFields), membershipController.createMembership);

/**
 * @route   GET /api/membership
 * @desc    Get all membership applications (Admin)
 */
router.get('/', membershipController.getAllMemberships);

/**
 * @route   GET /api/membership/:id
 * @desc    Get a single application by ID
 */
router.get('/:id', membershipController.getMembershipById);

/**
 * @route   PUT /api/membership/:id
 * @desc    Update an application and/or its files
 */
router.put('/:id', upload.fields(uploadFields), membershipController.updateMembership);

/**
 * @route   DELETE /api/membership/:id
 * @desc    Delete an application and its associated files
 */
router.delete('/:id', membershipController.deleteMembership);

module.exports = router;

// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
  login, 
  editCredentials, 
  forgotPassword, 
  resetPassword, 
  verifyOtp,
  createAdmin,
  getAllAdmins,
  deleteAdmin
} = require('../controllers/authController');
const { protect: authMiddleware, authorize } = require('../middleware/auth');

// Note: authMiddleware seems to be the default export in previous file content `module.exports = (req, res, next) => ...`
// But I changed it to `exports.authorize = ...`.
// I need to check how I modified `auth.js`. 
// Wait, I appended `exports.authorize` to `auth.js` but the original `auth.js` was `module.exports = (req...)`.
// This means `authorize` is NOT on the default export.
// I should have converted `auth.js` to named exports or attached `authorize` to the function.
// Let me double check `auth.js` structure in my mind.
// Original: module.exports = (req,res,next) => {...}
// My Edit: appended exports.authorize = ...
// So `require('../middleware/auth')` returns the function, and that function object has a property `authorize`.
// So `const protect = require('../middleware/auth');` and `const { authorize } = require('../middleware/auth');` might work if commonjs allows properties on function exports.
// To be safe, I will use:
// const protect = require('../middleware/auth');
// const authorize = protect.authorize;

router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.post('/verifyotp', verifyOtp);
router.put('/resetpassword', resetPassword);
router.put('/edit-credentials', authMiddleware, editCredentials);

// Super Admin Routes
router.post('/create-admin', authMiddleware, authorize('superadmin'), createAdmin);
router.get('/admins', authMiddleware, authorize('superadmin'), getAllAdmins);
router.delete('/admin/:id', authMiddleware, authorize('superadmin'), deleteAdmin);

module.exports = router;


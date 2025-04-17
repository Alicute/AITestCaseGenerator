const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  createAdminUser 
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

// 公开路由
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/create-admin', createAdminUser);

// 需要认证的路由
router.get('/profile', protect, getUserProfile);

// 管理员路由
router.route('/')
  .get(protect, authorize('admin'), getUsers);

router.route('/:id')
  .get(protect, authorize('admin'), getUserById)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
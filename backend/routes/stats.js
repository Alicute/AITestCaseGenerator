const express = require('express');
const router = express.Router();
const { getSystemStats } = require('../controllers/statController');
const { protect } = require('../middlewares/auth');

// 所有统计路由都需要认证
router.use(protect);

// 获取系统统计数据
router.get('/', getSystemStats);

module.exports = router; 
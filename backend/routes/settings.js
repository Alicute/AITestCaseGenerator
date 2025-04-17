const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');

/**
 * @desc   获取系统设置
 * @route  GET /api/v1/settings
 * @access Private/Admin
 */
router.get('/', protect, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    data: {
      general: {
        darkMode: false,
        autoSave: true,
        defaultView: 'list',
        language: 'zh-CN'
      },
      ai: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7
      }
    }
  });
});

/**
 * @desc   更新系统设置
 * @route  PUT /api/v1/settings
 * @access Private/Admin
 */
router.put('/', protect, authorize('admin'), (req, res) => {
  // 这里可以实现将设置保存到数据库的逻辑
  // 目前返回模拟数据
  res.json({
    success: true,
    message: '设置已更新',
    data: req.body
  });
});

module.exports = router; 
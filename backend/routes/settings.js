const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { Setting } = require('../models');

/**
 * @desc   获取系统设置
 * @route  GET /api/v1/settings
 * @access Private/Admin
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await Setting.findAll();

    // 构造配置对象
    const config = {
      general: {
        darkMode: false,
        autoSave: true,
        defaultView: 'list',
        language: 'zh-CN'
      },
      ai: {
        provider: 'gemini',
        model: 'gemini-pro',
        temperature: 0.7
      }
    };

    // 覆盖默认值
    settings.forEach(setting => {
      if (setting.category === 'ai') {
        if (setting.key === 'AI_PROVIDER') config.ai.provider = setting.value;
        if (setting.key === 'AI_MODEL') config.ai.model = setting.value;
        if (setting.key === 'AI_PROVIDER_NAME') config.ai.providerName = setting.value;
        // 其他AI配置...
      } else if (setting.category === 'general') {
        // general配置...
      }
      // 可以在这里处理更多配置
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统设置失败',
      error: error.message
    });
  }
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

/**
 * @desc   获取环境变量设置 (从数据库)
 * @route  GET /api/v1/settings/environment
 * @access Private/Admin
 */
router.get('/environment', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const envConfig = {};

    settings.forEach(setting => {
      envConfig[setting.key] = setting.value;
    });

    // 为了兼容前端，如果没有数据库记录，尝试读取process.env作为默认值(可选)
    // 但在这个迁移方案中，我们主要依赖数据库

    res.json({
      success: true,
      data: envConfig
    });
  } catch (error) {
    console.error('获取系统配置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取系统配置失败',
      error: error.message
    });
  }
});

/**
 * @desc   更新环境变量设置 (保存到数据库)
 * @route  PUT /api/v1/settings/environment
 * @access Private/Admin
 */
router.put('/environment', protect, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body;
    const updatePromises = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        let category = 'general';
        if (key.startsWith('AI_')) category = 'ai';
        if (key.startsWith('ZENTAO_')) category = 'zentao';

        updatePromises.push(
          Setting.upsert({
            key,
            value: String(value), // 确保存储为字符串
            category
          })
        );
      }
    }

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: '系统配置已更新'
    });
  } catch (error) {
    console.error('更新系统配置错误:', error);
    res.status(500).json({
      success: false,
      message: '更新系统配置失败',
      error: error.message
    });
  }
});

module.exports = router; 
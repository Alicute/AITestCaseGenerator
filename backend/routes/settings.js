const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 环境变量文件路径
const envFilePath = path.resolve(__dirname, '../.env');

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

/**
 * @desc   获取环境变量设置
 * @route  GET /api/v1/settings/environment
 * @access Private/Admin
 */
router.get('/environment', protect, authorize('admin'), (req, res) => {
  try {
    // 检查.env文件是否存在
    if (!fs.existsSync(envFilePath)) {
      return res.status(404).json({
        success: false,
        message: '环境变量文件不存在'
      });
    }

    // 读取.env文件内容
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
    
    // 返回环境变量
    res.json({
      success: true,
      data: envConfig
    });
  } catch (error) {
    console.error('获取环境变量错误:', error);
    res.status(500).json({
      success: false,
      message: '获取环境变量失败',
      error: error.message
    });
  }
});

/**
 * @desc   更新环境变量设置
 * @route  PUT /api/v1/settings/environment
 * @access Private/Admin
 */
router.put('/environment', protect, authorize('admin'), (req, res) => {
  try {
    // 获取要更新的环境变量
    const { ZENTAO_URL, ZENTAO_COOKIE } = req.body;
    
    // 检查.env文件是否存在
    let envContent = '';
    if (fs.existsSync(envFilePath)) {
      // 读取现有的.env文件内容
      envContent = fs.readFileSync(envFilePath, 'utf8');
    }
    
    // 更新环境变量内容
    const updateEnvVar = (content, key, value) => {
      const regex = new RegExp(`${key}\\s*=.*`, 'g');
      if (content.match(regex)) {
        // 如果变量已存在，则更新
        return content.replace(regex, `${key} = '${value}'`);
      } else {
        // 如果变量不存在，则添加
        return `${content}\n${key} = '${value}'`;
      }
    };
    
    // 更新禅道URL和Cookie
    if (ZENTAO_URL !== undefined) {
      envContent = updateEnvVar(envContent, 'ZENTAO_URL', ZENTAO_URL);
    }
    
    if (ZENTAO_COOKIE !== undefined) {
      envContent = updateEnvVar(envContent, 'ZENTAO_COOKIE', ZENTAO_COOKIE);
    }
    
    // 写入更新后的内容到.env文件
    fs.writeFileSync(envFilePath, envContent.trim());
    
    // 重新加载环境变量
    Object.assign(process.env, dotenv.parse(envContent));
    
    res.json({
      success: true,
      message: '环境变量已更新'
    });
  } catch (error) {
    console.error('更新环境变量错误:', error);
    res.status(500).json({
      success: false,
      message: '更新环境变量失败',
      error: error.message
    });
  }
});

module.exports = router; 
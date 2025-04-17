const express = require('express');
const router = express.Router();
const { 
  generateTestCases, 
  saveGeneratedTestCases, 
  getPromptTemplates,
  getAvailableModels
} = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

// 所有AI路由都需要认证
router.use(protect);

// 获取提示词模板和可用模型
router.get('/templates', getPromptTemplates);
router.get('/models', getAvailableModels);

// AI生成测试用例
router.post('/generate', generateTestCases);
router.post('/save', saveGeneratedTestCases);

module.exports = router;
const express = require('express');
const router = express.Router();
const testCaseController = require('../controllers/testCaseController');
const { protect } = require('../middlewares/auth');

// 所有测试用例路由都需要认证
router.use(protect);

// 批量创建测试用例
router.post('/batch', testCaseController.batchCreateTestCases);

module.exports = router; 
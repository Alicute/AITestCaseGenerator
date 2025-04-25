const express = require('express');
const router = express.Router();
const { 
  getTestCases,
  getTestCasesByModule,
  getTestCasesByProject,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  batchCreateTestCases,
  batchDeleteTestCases
} = require('../controllers/testCaseController');
const { protect } = require('../middlewares/auth');

// 所有测试用例路由都需要认证
router.use(protect);

// 获取特定模块或项目的测试用例
router.get('/module/:moduleId', getTestCasesByModule);
router.get('/project/:projectId', getTestCasesByProject);

// 基础路由
router.route('/')
  .get(getTestCases)
  .post(createTestCase);

// 批量操作路由
router.post('/batch', batchCreateTestCases);
router.delete('/batch', batchDeleteTestCases);

// 带参数的路由
router.route('/:id')
  .get(getTestCase)
  .put(updateTestCase)
  .delete(deleteTestCase);

module.exports = router; 
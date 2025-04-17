const express = require('express');
const router = express.Router();
const { 
  getTestCases,
  getTestCasesByModule,
  getTestCasesByProject,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase
} = require('../controllers/testCaseController');
const { protect } = require('../middlewares/auth');

// 所有测试用例路由都需要认证
router.use(protect);

// 获取特定模块或项目的测试用例
router.get('/module/:moduleId', getTestCasesByModule);
router.get('/project/:projectId', getTestCasesByProject);

// 测试用例CRUD操作
router.route('/')
  .get(getTestCases)
  .post(createTestCase);

router.route('/:id')
  .get(getTestCase)
  .put(updateTestCase)
  .delete(deleteTestCase);

module.exports = router;
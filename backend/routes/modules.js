const express = require('express');
const router = express.Router();
const { 
  getModulesByProject, 
  getModule, 
  createModule, 
  updateModule, 
  deleteModule 
} = require('../controllers/moduleController');
const { protect } = require('../middlewares/auth');

// 所有模块路由都需要认证
router.use(protect);

// 获取项目的所有模块
router.get('/project/:projectId', getModulesByProject);

// 模块CRUD操作
router.route('/')
  .post(createModule);

router.route('/:id')
  .get(getModule)
  .put(updateModule)
  .delete(deleteModule);

module.exports = router; 
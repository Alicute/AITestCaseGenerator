const express = require('express');
const router = express.Router();
const { 
  getModules,
  getModule, 
  createModule, 
  updateModule, 
  deleteModule,
  getModuleFunctions,
  getModuleTree
} = require('../controllers/moduleController');
const { protect } = require('../middlewares/auth');

// 所有模块路由都需要认证
router.use(protect);

// 获取模块列表（可按项目过滤）
router.get('/', getModules);

// 获取模块树（使用与注释匹配的路径）
router.get('/tree', getModuleTree);

// 模块CRUD操作
router.post('/', createModule);

// ID参数路由
router.get('/:id', getModule);
router.put('/:id', updateModule);
router.delete('/:id', deleteModule);

// 获取模块的功能点
router.get('/:id/functions', getModuleFunctions);

module.exports = router; 
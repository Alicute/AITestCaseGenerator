const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const moduleController = require('../controllers/moduleController');

/**
 * @desc    获取模块列表
 * @route   GET /api/v1/modules
 * @access  Private
 */
router.get('/', protect, moduleController.getModules);

/**
 * @desc    获取单个模块
 * @route   GET /api/v1/modules/:id
 * @access  Private
 */
router.get('/:id', protect, moduleController.getModule);

/**
 * @desc    创建模块
 * @route   POST /api/v1/modules
 * @access  Private
 */
router.post('/', protect, moduleController.createModule);

/**
 * @desc    更新模块
 * @route   PUT /api/v1/modules/:id
 * @access  Private
 */
router.put('/:id', protect, moduleController.updateModule);

/**
 * @desc    删除模块
 * @route   DELETE /api/v1/modules/:id
 * @access  Private
 */
router.delete('/:id', protect, moduleController.deleteModule);

/**
 * @desc    获取模块的功能点
 * @route   GET /api/v1/modules/:id/functions
 * @access  Private
 */
router.get('/:id/functions', protect, moduleController.getModuleFunctions);

/**
 * @desc    获取项目的模块树
 * @route   GET /api/v1/modules/tree
 * @access  Private
 */
router.get('/tree', protect, moduleController.getModuleTree);

/**
 * @desc    重新计算模块测试用例数量
 * @route   POST /api/v1/modules/recalculate-counts
 * @access  Private
 */
router.post('/recalculate-counts', protect, moduleController.recalculateTestCaseCounts);

module.exports = router;
const express = require('express');
const router = express.Router();
const { 
  getTestCases,
  getTestCasesByModule,
  getTestCasesByProject,
  getTestCase
} = require('../controllers/testCaseController');
const {
  getModules,
  getModule
} = require('../controllers/moduleController');
const {
  getProjects,
  getProject
} = require('../controllers/projectController');

// 公开API路由 - 不需要认证，仅限只读操作

// ===== 测试用例接口 =====
/**
 * @desc    获取所有测试用例（公开）
 * @route   GET /api/v1/public/testcases
 * @access  Public
 */
router.get('/testcases', getTestCases);

/**
 * @desc    获取模块的测试用例（公开）
 * @route   GET /api/v1/public/testcases/module/:moduleId
 * @access  Public
 */
router.get('/testcases/module/:moduleId', getTestCasesByModule);

/**
 * @desc    获取项目的测试用例（公开）
 * @route   GET /api/v1/public/testcases/project/:projectId
 * @access  Public
 */
router.get('/testcases/project/:projectId', getTestCasesByProject);

/**
 * @desc    获取单个测试用例（公开）
 * @route   GET /api/v1/public/testcases/:id
 * @access  Public
 */
router.get('/testcases/:id', getTestCase);

// ===== 模块接口 =====
/**
 * @desc    获取所有模块（公开）
 * @route   GET /api/v1/public/modules
 * @access  Public
 */
router.get('/modules', getModules);

/**
 * @desc    获取单个模块（公开）
 * @route   GET /api/v1/public/modules/:id
 * @access  Public
 */
router.get('/modules/:id', getModule);

// ===== 项目接口 =====
/**
 * @desc    获取所有项目（公开）
 * @route   GET /api/v1/public/projects
 * @access  Public
 */
router.get('/projects', getProjects);

/**
 * @desc    获取单个项目（公开）
 * @route   GET /api/v1/public/projects/:id
 * @access  Public
 */
router.get('/projects/:id', getProject);

module.exports = router;

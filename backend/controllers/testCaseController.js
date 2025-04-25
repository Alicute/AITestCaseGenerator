const { TestCase, Module, Project } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
/**
 * @desc    获取所有测试用例
 * @route   GET /api/v1/testcases
 * @access  Private
 */
exports.getTestCases = async (req, res) => {
  try {
    const { moduleId, projectId, page = 1, limit = 10, search } = req.query;
    const where = {};

    // 如果有项目ID，添加到查询条件
    if (projectId) {
      where.projectId = projectId;
    }

    // 如果有模块ID，添加到查询条件
    if (moduleId) {
      where.moduleId = moduleId;
    }

    // 如果有搜索关键字，添加搜索条件
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { steps: { [Op.like]: `%${search}%` } },
        { expectedResult: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await TestCase.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { 
          model: Module, 
          attributes: ['id', 'name', 'path']
        },
        { model: User, as: 'creator', attributes: ['username'] },
        { model: User, as: 'executor', attributes: ['username'] }
      ],
      attributes: [
        'id',
        'title',
        'moduleId',
        'projectId',
        'precondition',
        'steps',
        'expectedResult',
        'priority',
        'type',
        'maintainer',
        'testType',
        'estimatedHours',
        'remainingHours',
        'relatedItems',
        'followers',
        'notes',
        'createdAt',
        'updatedAt'
      ]
    });

    // 处理返回的数据，确保字段名称正确
    const processedData = rows.map(testCase => {
      const testCaseJson = testCase.toJSON();
      return {
        ...testCaseJson,
        module: testCaseJson.Module ? testCaseJson.Module.name : null,
        preconditions: testCaseJson.precondition,
        expectedResults: testCaseJson.expectedResult
      };
    });

    return res.json({
      success: true,
      data: processedData,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取测试用例列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取测试用例列表失败',
      error: error.message
    });
  }
};

/**
 * @desc    获取模块的测试用例
 * @route   GET /api/v1/testcases/module/:moduleId
 * @access  Private
 */
exports.getTestCasesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    // 验证模块存在
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 检查用户是否有权限查看此模块的测试用例
    const project = await Project.findByPk(module.projectId);
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权访问此模块'
      });
    }
    
    // 获取模块的测试用例
    const testCases = await TestCase.findAll({
      where: { moduleId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: testCases.length,
      data: testCases
    });
  } catch (error) {
    console.error('获取模块测试用例错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取项目的测试用例
 * @route   GET /api/v1/testcases/project/:projectId
 * @access  Private
 */
exports.getTestCasesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // 验证项目存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限查看此项目的测试用例
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权访问此项目'
      });
    }
    
    // 构建查询条件
    const queryObj = { ...req.query, projectId };
    
    // 排除特殊查询参数
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);
    
    // 创建where条件
    const where = { projectId };
    
    // 处理过滤条件
    Object.keys(queryObj).forEach(key => {
      if (!excludedFields.includes(key)) {
        where[key] = queryObj[key];
      }
    });
    
    // 分页
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // 排序
    let order = [['createdAt', 'DESC']];
    if (req.query.sort) {
      const sortFields = req.query.sort.split(',');
      order = sortFields.map(field => {
        const direction = field.startsWith('-') ? 'DESC' : 'ASC';
        return [field.replace('-', ''), direction];
      });
    }
    
    // 执行查询
    const { count, rows: testCases } = await TestCase.findAndCountAll({
      where,
      include: [
        { model: Module, as: 'module', attributes: ['name', 'path'] },
        { model: User, as: 'creator', attributes: ['username'] },
        { model: User, as: 'executor', attributes: ['username'] }
      ],
      offset,
      limit,
      order
    });
    
    res.json({
      success: true,
      count: testCases.length,
      total: count,
      pagination: {
        current: page,
        pages: Math.ceil(count / limit)
      },
      data: testCases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取单个测试用例
 * @route   GET /api/v1/testcases/:id
 * @access  Private
 */
exports.getTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    const testCase = await TestCase.findByPk(id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: '测试用例不存在'
      });
    }

    return res.json({
      success: true,
      data: testCase
    });
  } catch (error) {
    console.error('获取测试用例失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取测试用例失败',
      error: error.message
    });
  }
};

/**
 * @desc    创建测试用例
 * @route   POST /api/v1/testcases
 * @access  Private
 */
exports.createTestCase = async (req, res) => {
  try {
    const {
      title,
      moduleId,
      projectId,
      precondition,
      steps,
      expectedResult,
      priority,
      type,
      maintainer,
      testType,
      estimatedHours,
      remainingHours,
      relatedItems,
      followers,
      notes
    } = req.body;

    // 验证必填字段
    if (!title || !moduleId || !projectId || !steps || !expectedResult) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }

    // 检查模块是否存在
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '模块不存在'
      });
    }

    // 检查项目是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 检查测试用例是否已存在
    const existingTestCase = await TestCase.findOne({
      where: {
        title,
        moduleId
      }
    });

    if (existingTestCase) {
      return res.status(409).json({
        success: false,
        message: '该模块下已存在相同标题的测试用例'
      });
    }

    // 创建测试用例
    const testCase = await TestCase.create({
      title,
      moduleId,
      projectId,
      precondition,
      steps,
      expectedResult,
      priority,
      type,
      maintainer,
      testType,
      estimatedHours,
      remainingHours,
      relatedItems,
      followers,
      notes,
      createdBy: req.user.id
    });

    // 更新模块的测试用例计数
    await module.increment('testCaseCount');

    return res.status(201).json({
      success: true,
      message: '测试用例创建成功',
      data: testCase
    });
  } catch (error) {
    console.error('创建测试用例失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建测试用例失败',
      error: error.message
    });
  }
};

/**
 * @desc    更新测试用例
 * @route   PUT /api/v1/testcases/:id
 * @access  Private
 */
exports.updateTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const testCase = await TestCase.findByPk(id);
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: '测试用例不存在'
      });
    }

    // 如果更新了标题，检查是否与其他测试用例冲突
    if (updateData.title && updateData.title !== testCase.title) {
      const existingTestCase = await TestCase.findOne({
        where: {
          title: updateData.title,
          moduleId: testCase.moduleId,
          id: { [Op.ne]: id }
        }
      });

      if (existingTestCase) {
        return res.status(409).json({
          success: false,
          message: '该模块下已存在相同标题的测试用例'
        });
      }
    }

    await testCase.update(updateData);

    return res.json({
      success: true,
      message: '测试用例更新成功',
      data: testCase
    });
  } catch (error) {
    console.error('更新测试用例失败:', error);
    return res.status(500).json({
      success: false,
      message: '更新测试用例失败',
      error: error.message
    });
  }
};

/**
 * @desc    删除测试用例
 * @route   DELETE /api/v1/testcases/:id
 * @access  Private
 */
exports.deleteTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    const testCase = await TestCase.findByPk(id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: '测试用例不存在'
      });
    }

    await testCase.destroy();

    // 更新模块的测试用例计数
    const module = await Module.findByPk(testCase.moduleId);
    if (module) {
      await module.decrement('testCaseCount');
    }

    return res.json({
      success: true,
      message: '测试用例删除成功'
    });
  } catch (error) {
    console.error('删除测试用例失败:', error);
    return res.status(500).json({
      success: false,
      message: '删除测试用例失败',
      error: error.message
    });
  }
};

exports.batchCreateTestCases = asyncHandler(async (req, res) => {
  const { projectId, testCases } = req.body;

  if (!projectId || !testCases || !Array.isArray(testCases)) {
    return res.status(400).json({
      success: false,
      message: '请提供项目ID和测试用例数据'
    });
  }

  try {
    // 为每个测试用例添加项目ID，并处理必要字段
    const testCasesWithProjectId = testCases.map(testCase => {
      const { id, estimatedHours, remainingHours, ...rest } = testCase;
      
      return {
        title: testCase.title,
        moduleId: testCase.moduleId,
        projectId,
        type: testCase.type || '功能测试',
        priority: testCase.priority || 'P1',
        testType: testCase.testType || '手动',
        precondition: testCase.preconditions || '',
        steps: testCase.steps || '',
        expectedResult: testCase.expectedResults || '',
        maintainer: testCase.maintainer || null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        remainingHours: remainingHours ? parseFloat(remainingHours) : null,
        relatedItems: testCase.relatedItems || null,
        followers: testCase.followers || null,
        notes: testCase.notes || null
      };
    });

    // 批量创建测试用例
    const createdTestCases = await TestCase.bulkCreate(testCasesWithProjectId);

    res.status(201).json({
      success: true,
      data: createdTestCases,
      message: `成功创建 ${createdTestCases.length} 个测试用例`
    });
  } catch (error) {
    console.error('批量创建测试用例错误:', error);
    res.status(500).json({
      success: false,
      message: '创建测试用例时发生错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}); 
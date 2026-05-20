const { TestCase, Module, Project } = require('../models');
const { Op } = require('sequelize');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
/**
 * @desc    获取所有测试用例
 * @route   GET /api/v1/testcases
 * @access  Private
 */
exports.getTestCases = async (req, res) => {
  try {
    const { moduleId, projectId, priority, type, status, page = 1, limit = 10, search, labels } = req.query;
    const where = {};
    const statusMap = {
      waiting: '未执行',
      running: '执行中',
      passed: '通过',
      failed: '失败'
    };

    // 如果有项目ID，添加到查询条件
    if (projectId) {
      where.projectId = projectId;
    }

    // 如果有模块ID，添加到查询条件
    if (moduleId) {
      where.moduleId = moduleId;
    }

    if (priority) {
      where.priority = priority;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = statusMap[status] || status;
    }

    // 如果有标签筛选
    if (labels) {
      const { sequelize } = require('../config/database');
      where[Op.and] = sequelize.literal(`JSON_CONTAINS(labels, '"${labels}"')`);
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
        }
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
        'labels',
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
      order: [['createdAt', 'DESC']],
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
        { model: User, as: 'creator', attributes: ['username'] , foreignKey: 'createdBy' },
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
      const {  estimatedHours, remainingHours } = testCase;
      
      return {
        title: testCase.title,
        moduleId: testCase.moduleId,
        projectId,
        type: testCase.type || '功能测试',
        priority: testCase.priority || 'P1',
        status: testCase.status || '未执行',
        testType: testCase.testType || '手动',
        precondition: testCase.precondition ?? testCase.preconditions ?? '',
        steps: Array.isArray(testCase.steps) ? testCase.steps.join('\n') : (testCase.steps || ''),
        expectedResult: testCase.expectedResult ?? testCase.expectedResults ?? '',
        maintainer: testCase.maintainer || null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        remainingHours: remainingHours ? parseFloat(remainingHours) : null,
        relatedItems: testCase.relatedItems || null,
        followers: testCase.followers || null,
        notes: testCase.notes || null
      };
    });

    // 批量创建测试用例，遇到重复时更新
    const createdTestCases = await TestCase.bulkCreate(testCasesWithProjectId, {
      updateOnDuplicate: ['precondition', 'steps', 'expectedResult', 'priority', 'status', 'type', 'maintainer', 'testType', 'estimatedHours', 'remainingHours', 'relatedItems', 'followers', 'notes']
    });

    const moduleIds = [...new Set(testCasesWithProjectId.map(testCase => testCase.moduleId).filter(Boolean))];
    for (const moduleId of moduleIds) {
      const count = await TestCase.count({ where: { moduleId } });
      await Module.update({ testCaseCount: count }, { where: { id: moduleId } });
    }

    const projectCount = await TestCase.count({ where: { projectId } });
    await Project.update({ testCaseCount: projectCount }, { where: { id: projectId } });

    res.status(201).json({
      success: true,
      data: createdTestCases,
      message: `成功创建/更新 ${createdTestCases.length} 个测试用例`
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

/**
 * @desc    批量删除测试用例
 * @route   DELETE /api/v1/testcases/batch
 * @access  Private
 */
exports.batchDeleteTestCases = asyncHandler(async (req, res) => {
  const { testCaseIds } = req.body;

  if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供要删除的测试用例ID列表'
    });
  }

  try {
    // 检查所有测试用例是否存在
    const testCases = await TestCase.findAll({
      where: {
        id: {
          [Op.in]: testCaseIds
        }
      }
    });

    if (testCases.length !== testCaseIds.length) {
      return res.status(404).json({
        success: false,
        message: '部分测试用例不存在'
      });
    }

    // 批量删除测试用例
    await TestCase.destroy({
      where: {
        id: {
          [Op.in]: testCaseIds
        }
      }
    });

    // 更新相关模块的测试用例计数
    const moduleIds = [...new Set(testCases.map(tc => tc.moduleId))];
    for (const moduleId of moduleIds) {
      const module = await Module.findByPk(moduleId);
      if (module) {
        const count = await TestCase.count({ where: { moduleId } });
        await module.update({ testCaseCount: count });
      }
    }

    res.json({
      success: true,
      message: `成功删除 ${testCaseIds.length} 个测试用例`
    });
  } catch (error) {
    console.error('批量删除测试用例错误:', error);
    res.status(500).json({
      success: false,
      message: '删除测试用例时发生错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}); 

/**
 * @desc    批量设置测试用例标签
 * @route   POST /api/v1/testcases/batch-labels
 * @access  Private
 */
exports.batchLabels = asyncHandler(async (req, res) => {
  const { ids, moduleId, projectId, labels, mode = 'replace' } = req.body;

  if (!labels || !Array.isArray(labels)) {
    return res.status(400).json({ success: false, message: 'labels 必须是数组' });
  }

  const where = {};
  if (ids && ids.length > 0) {
    where.id = { [Op.in]: ids };
  } else if (moduleId) {
    where.moduleId = moduleId;
  } else if (projectId) {
    where.projectId = projectId;
  } else {
    return res.status(400).json({ success: false, message: '必须提供 ids、moduleId 或 projectId 之一' });
  }

  const testCases = await TestCase.findAll({ where });

  for (const tc of testCases) {
    let newLabels;
    if (mode === 'merge') {
      const existing = tc.labels || [];
      newLabels = [...new Set([...existing, ...labels])];
    } else {
      newLabels = labels;
    }
    await tc.update({ labels: newLabels });
  }

  res.json({
    success: true,
    message: `成功更新 ${testCases.length} 个测试用例的标签`,
    count: testCases.length
  });
});

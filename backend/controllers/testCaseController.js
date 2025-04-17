const TestCase = require('../models/TestCase');
const Module = require('../models/Module');
const Project = require('../models/Project');

/**
 * @desc    获取所有测试用例
 * @route   GET /api/v1/testcases
 * @access  Private
 */
exports.getTestCases = async (req, res) => {
  try {
    // 构建查询条件
    const queryObj = { ...req.query };
    
    // 排除特殊查询参数
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);
    
    // 构建查询字符串
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // 基本查询
    let query = TestCase.find(JSON.parse(queryStr))
      .populate('module', 'name path')
      .populate('creator', 'username')
      .populate('executor', 'username');
    
    // 排序
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // 分页
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    query = query.skip(startIndex).limit(limit);
    
    // 执行查询
    const testCases = await query;
    const total = await TestCase.countDocuments(JSON.parse(queryStr));
    
    res.json({
      success: true,
      count: testCases.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit)
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
 * @desc    获取模块的测试用例
 * @route   GET /api/v1/testcases/module/:moduleId
 * @access  Private
 */
exports.getTestCasesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    // 验证模块存在
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 检查用户是否有权限查看此模块的测试用例
    const project = await Project.findById(module.projectId);
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权访问此模块'
      });
    }
    
    // 获取模块的测试用例
    const testCases = await TestCase.find({ module: moduleId })
      .populate('creator', 'username')
      .populate('executor', 'username')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: testCases.length,
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
 * @desc    获取项目的测试用例
 * @route   GET /api/v1/testcases/project/:projectId
 * @access  Private
 */
exports.getTestCasesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // 验证项目存在
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限查看此项目的测试用例
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
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
    
    // 构建查询字符串
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // 基本查询
    let query = TestCase.find(JSON.parse(queryStr))
      .populate('module', 'name path')
      .populate('creator', 'username')
      .populate('executor', 'username');
    
    // 排序
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // 分页
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    query = query.skip(startIndex).limit(limit);
    
    // 执行查询
    const testCases = await query;
    const total = await TestCase.countDocuments(JSON.parse(queryStr));
    
    res.json({
      success: true,
      count: testCases.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit)
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
    const testCase = await TestCase.findById(req.params.id)
      .populate('module', 'name path')
      .populate('creator', 'username')
      .populate('executor', 'username');
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: '未找到测试用例'
      });
    }
    
    // 检查用户是否有权限查看此测试用例
    const project = await Project.findById(testCase.projectId);
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权访问此测试用例'
      });
    }
    
    res.json({
      success: true,
      data: testCase
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
 * @desc    创建测试用例
 * @route   POST /api/v1/testcases
 * @access  Private
 */
exports.createTestCase = async (req, res) => {
  try {
    const { module: moduleId, projectId, title, priority, type, precondition, steps, expectedResult, isGenerated, aiProvider } = req.body;
    
    // 验证模块存在
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 验证项目存在
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限在此项目中创建测试用例
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权在此项目中创建测试用例'
      });
    }
    
    // 创建测试用例
    const testCase = await TestCase.create({
      title,
      module: moduleId,
      projectId,
      priority,
      type,
      precondition,
      steps,
      expectedResult,
      isGenerated,
      aiProvider,
      creator: req.user._id
    });
    
    // 更新项目和模块的测试用例计数
    await Project.findByIdAndUpdate(projectId, {
      $inc: { testCaseCount: 1 }
    });
    
    await Module.findByIdAndUpdate(moduleId, {
      $inc: { testCaseCount: 1 }
    });
    
    res.status(201).json({
      success: true,
      data: testCase
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    const testCase = await TestCase.findById(req.params.id);
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: '未找到测试用例'
      });
    }
    
    // 检查用户是否有权限更新此测试用例
    const project = await Project.findById(testCase.projectId);
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权更新此测试用例'
      });
    }
    
    // 如果更改了模块，需要更新计数
    if (req.body.module && req.body.module.toString() !== testCase.module.toString()) {
      // 减少原模块的计数
      await Module.findByIdAndUpdate(testCase.module, {
        $inc: { testCaseCount: -1 }
      });
      
      // 增加新模块的计数
      await Module.findByIdAndUpdate(req.body.module, {
        $inc: { testCaseCount: 1 }
      });
    }
    
    // 更新测试用例
    const updatedTestCase = await TestCase.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('module', 'name path')
     .populate('creator', 'username')
     .populate('executor', 'username');
    
    res.json({
      success: true,
      data: updatedTestCase
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    const testCase = await TestCase.findById(req.params.id);
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: '未找到测试用例'
      });
    }
    
    // 检查用户是否有权限删除此测试用例
    const project = await Project.findById(testCase.projectId);
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权删除此测试用例'
      });
    }
    
    // 删除测试用例
    await testCase.remove();
    
    // 更新项目和模块的测试用例计数
    await Project.findByIdAndUpdate(testCase.projectId, {
      $inc: { testCaseCount: -1 }
    });
    
    await Module.findByIdAndUpdate(testCase.module, {
      $inc: { testCaseCount: -1 }
    });
    
    res.json({
      success: true,
      message: '测试用例已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 
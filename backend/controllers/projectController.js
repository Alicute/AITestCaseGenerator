const Project = require('../models/Project');
const Module = require('../models/Module');

/**
 * @desc    获取所有项目
 * @route   GET /api/v1/projects
 * @access  Private
 */
exports.getProjects = async (req, res) => {
  try {
    // 查找当前用户的项目（创建的或者是成员的）
    const projects = await Project.find({
      $or: [
        { creator: req.user._id },
        { members: req.user._id }
      ]
    }).populate('creator', 'username');
    
    res.json({
      success: true,
      count: projects.length,
      data: projects
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
 * @desc    获取单个项目
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('creator', 'username email')
      .populate('members', 'username email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限查看此项目
    if (
      project.creator._id.toString() !== req.user._id.toString() && 
      !project.members.some(member => member._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权访问此项目'
      });
    }
    
    res.json({
      success: true,
      data: project
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
 * @desc    创建项目
 * @route   POST /api/v1/projects
 * @access  Private
 */
exports.createProject = async (req, res) => {
  try {
    const { name, description, templateId } = req.body;
    
    // 添加创建者ID
    req.body.creator = req.user._id;
    
    // 创建项目
    const project = await Project.create(req.body);
    
    res.status(201).json({
      success: true,
      data: project
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
 * @desc    更新项目
 * @route   PUT /api/v1/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限更新此项目
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有项目创建者才能更新项目'
      });
    }
    
    // 更新项目
    project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.json({
      success: true,
      data: project
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
 * @desc    删除项目
 * @route   DELETE /api/v1/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限删除此项目
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有项目创建者才能删除项目'
      });
    }
    
    // 删除项目下的所有模块
    await Module.deleteMany({ projectId: project._id });
    
    // 删除项目
    await project.remove();
    
    res.json({
      success: true,
      message: '项目已删除'
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
 * @desc    获取项目模板
 * @route   GET /api/v1/projects/templates
 * @access  Private
 */
exports.getProjectTemplates = async (req, res) => {
  try {
    // 这里可以从数据库中获取项目模板
    // 现在我们先返回硬编码的模板数据
    const templates = [
      {
        id: 1,
        name: '常规测试项目',
        description: '基础功能测试模板',
        icon: '📋'
      },
      {
        id: 2,
        name: 'API测试项目',
        description: '接口测试专用模板',
        icon: '🌐'
      },
      {
        id: 3,
        name: 'UI测试项目',
        description: '界面测试专用模板',
        icon: '🖥️'
      },
      {
        id: 4,
        name: '性能测试项目',
        description: '性能测试专用模板',
        icon: '⚡'
      }
    ];
    
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
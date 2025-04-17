const Module = require('../models/Module');
const Project = require('../models/Project');
const TestCase = require('../models/TestCase');

/**
 * @desc    获取项目的所有模块
 * @route   GET /api/v1/modules/project/:projectId
 * @access  Private
 */
exports.getModulesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // 检查项目是否存在
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限查看此项目的模块
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权访问此项目'
      });
    }
    
    // 获取项目的根模块（parentId为null的模块）
    const rootModules = await Module.find({ 
      projectId,
      parentId: null
    }).sort('name');
    
    // 递归获取所有子模块
    const populatedModules = await Promise.all(
      rootModules.map(async (module) => {
        return await populateChildren(module);
      })
    );
    
    res.json({
      success: true,
      count: populatedModules.length,
      data: populatedModules
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
 * 递归获取模块的所有子模块
 */
async function populateChildren(module) {
  const moduleObj = module.toObject();
  const children = await Module.find({ parentId: module._id }).sort('name');
  
  if (children.length > 0) {
    moduleObj.children = await Promise.all(
      children.map(async (child) => {
        return await populateChildren(child);
      })
    );
  } else {
    moduleObj.children = [];
  }
  
  return moduleObj;
}

/**
 * @desc    获取单个模块详情
 * @route   GET /api/v1/modules/:id
 * @access  Private
 */
exports.getModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 检查用户是否有权限查看此模块
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
    
    res.json({
      success: true,
      data: module
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
 * @desc    创建模块
 * @route   POST /api/v1/modules
 * @access  Private
 */
exports.createModule = async (req, res) => {
  try {
    const { projectId, parentId, name, description, functionPoints } = req.body;
    
    // 检查项目是否存在
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限为此项目创建模块
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权在此项目中创建模块'
      });
    }
    
    // 处理level和path
    let level = 0;
    let path = '';
    
    if (parentId) {
      const parentModule = await Module.findById(parentId);
      if (!parentModule) {
        return res.status(404).json({
          success: false,
          message: '未找到父模块'
        });
      }
      
      level = parentModule.level + 1;
      path = parentModule.path ? `${parentModule.path}/${name}` : name;
    } else {
      path = name;
    }
    
    // 创建模块
    const module = await Module.create({
      projectId,
      parentId,
      name,
      description,
      functionPoints,
      level,
      path,
      createdBy: req.user._id
    });
    
    // 更新项目的模块计数
    await Project.findByIdAndUpdate(projectId, {
      $inc: { moduleCount: 1 }
    });
    
    res.status(201).json({
      success: true,
      data: module
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
 * @desc    更新模块
 * @route   PUT /api/v1/modules/:id
 * @access  Private
 */
exports.updateModule = async (req, res) => {
  try {
    const { name, description, functionPoints } = req.body;
    
    let module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 检查用户是否有权限更新此模块
    const project = await Project.findById(module.projectId);
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权更新此模块'
      });
    }
    
    // 如果名称更改，需要更新path
    if (name && name !== module.name) {
      // 更新当前模块的path
      const oldName = module.name;
      const newPath = module.path.replace(new RegExp(`${oldName}$`), name);
      
      module.name = name;
      module.path = newPath;
      
      // 更新所有子模块的path
      const childModules = await Module.find({
        path: { $regex: `^${module.path}/` }
      });
      
      for (const child of childModules) {
        child.path = child.path.replace(
          new RegExp(`^${module.path.replace(name, oldName)}/`), 
          `${newPath}/`
        );
        await child.save();
      }
    }
    
    if (description) module.description = description;
    if (functionPoints) module.functionPoints = functionPoints;
    
    await module.save();
    
    res.json({
      success: true,
      data: module
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
 * @desc    删除模块
 * @route   DELETE /api/v1/modules/:id
 * @access  Private
 */
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 检查用户是否有权限删除此模块
    const project = await Project.findById(module.projectId);
    if (
      project.creator.toString() !== req.user._id.toString() && 
      !project.members.some(member => member.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: '无权删除此模块'
      });
    }
    
    // 先获取此模块和所有子模块的ID
    const childModules = await Module.find({
      path: { $regex: new RegExp(`^${module.path}/`) }
    });
    
    const moduleIds = [module._id, ...childModules.map(m => m._id)];
    
    // 删除这些模块关联的测试用例
    const testCases = await TestCase.find({ module: { $in: moduleIds } });
    const testCaseCount = testCases.length;
    
    await TestCase.deleteMany({ module: { $in: moduleIds } });
    
    // 删除子模块
    await Module.deleteMany({ 
      _id: { $in: childModules.map(m => m._id) }
    });
    
    // 删除当前模块
    await module.remove();
    
    // 更新项目的模块计数和测试用例计数
    await Project.findByIdAndUpdate(module.projectId, {
      $inc: { 
        moduleCount: -(childModules.length + 1),
        testCaseCount: -testCaseCount
      }
    });
    
    res.json({
      success: true,
      message: `模块及其${childModules.length}个子模块已删除，${testCaseCount}个测试用例已删除`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 
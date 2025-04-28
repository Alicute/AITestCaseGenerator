const Module = require('../models/Module');
const Project = require('../models/Project');
const TestCase = require('../models/TestCase');
const Function = require('../models/Function'); // 添加这一行
/**
 * @desc    获取项目的所有模块
 * @route   GET /api/v1/modules
 * @access  Private
 */
exports.getModules = async (req, res) => {
  try {
    const { projectId } = req.query;
    
    // 如果提供了projectId，则按项目过滤
    const where = projectId ? { projectId } : {};
    
    // 使用Sequelize查询所有模块
    const modules = await Module.findAll({
      where,
      order: [['name', 'ASC']]
    });
    
    // 即使没有数据也返回空数组
    res.json({
      success: true,
      count: modules.length,
      data: modules || []
    });
  } catch (error) {
    console.error('获取模块列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取单个模块详情
 * @route   GET /api/v1/modules/:id
 * @access  Private
 */
exports.getModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('获取模块详情错误:', error);
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
    const { projectId, parentId, name, description,  } = req.body;
    
    // 处理level和path
    let level = 0;
    let path = '';
    
    if (parentId) {
      const parentModule = await Module.findByPk(parentId);
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
    
    // 创建模块 - 移除不属于Module模型的functionPoints字段
    const module = await Module.create({
      projectId,
      parentId,
      name,
      description,
      level,
      path
    });
    
    // 更新项目的模块计数（如果需要）
    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (project) {
        await project.update({
          moduleCount: (project.moduleCount || 0) + 1
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('创建模块错误:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
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
    const module = await Module.findByPk(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 更新模块
    await module.update(req.body);
    
    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('更新模块错误:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
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
    const module = await Module.findByPk(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 查找子模块
    const childModules = await Module.findAll({
      where: {
        parentId: req.params.id
      }
    });
    
    // 递归删除所有子模块
    for (const childModule of childModules) {
      // 不要直接调用控制器方法，而是递归执行删除逻辑
      await deleteModuleRecursively(childModule.id);
    }
    
    // 删除与此模块相关的功能点
    await Function.destroy({
      where: {
        moduleId: req.params.id
      }
    });
    
    // 删除与此模块相关的测试用例
    await TestCase.destroy({
      where: {
        moduleId: req.params.id
      }
    });
    
    // 减少项目的模块计数
    if (module.projectId) {
      const project = await Project.findByPk(module.projectId);
      if (project && project.moduleCount > 0) {
        await project.update({
          moduleCount: project.moduleCount - 1
        });
      }
    }
    
    // 删除模块
    await module.destroy();
    
    res.json({
      success: true,
      message: '模块已删除'
    });
  } catch (error) {
    console.error('删除模块错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 递归删除模块及其所有子模块、功能点和测试用例
 * @param {Number} moduleId - 要删除的模块ID
 */
async function deleteModuleRecursively(moduleId) {
  try {
    // 查找所有子模块
    const childModules = await Module.findAll({
      where: {
        parentId: moduleId
      }
    });
    
    // 递归删除子模块
    for (const childModule of childModules) {
      await deleteModuleRecursively(childModule.id);
    }
    
    // 删除与此模块相关的功能点
    await Function.destroy({
      where: {
        moduleId: moduleId
      }
    });
    
    // 删除与此模块相关的测试用例
    await TestCase.destroy({
      where: {
        moduleId: moduleId
      }
    });
    
    // 查找模块信息（用于更新项目计数）
    const module = await Module.findByPk(moduleId);
    
    // 减少项目的模块计数
    if (module && module.projectId) {
      const project = await Project.findByPk(module.projectId);
      if (project && project.moduleCount > 0) {
        await project.update({
          moduleCount: project.moduleCount - 1
        });
      }
    }
    
    // 删除模块本身
    if (module) {
      await module.destroy();
    }
    
    return true;
  } catch (error) {
    console.error(`递归删除模块 ${moduleId} 错误:`, error);
    throw error; // 向上抛出错误，让主方法处理
  }
}

/**
 * @desc    获取模块的功能点
 * @route   GET /api/v1/modules/:id/functions
 * @access  Private
 */
exports.getModuleFunctions = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 使用Function模型查询与模块关联的功能点
    const functions = await Function.findAll({
      where: { moduleId: req.params.id },
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      count: functions.length,
      data: functions
    });
  } catch (error) {
    console.error('获取模块功能点错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取项目的模块树
 * @route   GET /api/v1/modules/tree
 * @access  Private
 */
exports.getModuleTree = async (req, res) => {
  try {
    const { projectId, _t } = req.query; // 添加_t时间戳参数，用于防止缓存
    
    // 如果没有提供projectId，返回空数组而不是错误
    if (!projectId) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: '没有选择项目，显示空模块列表'
      });
    }
    
    // 验证项目是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 获取项目的所有模块
    const modules = await Module.findAll({
      where: { projectId },
      order: [
        ['level', 'ASC'],
        ['name', 'ASC']
      ],
      attributes: ['id', 'name', 'description', 'level', 'path', 'parentId', 'projectId', 'createdAt', 'updatedAt', 'functionCount', 'testCaseCount']
    });

    // 记录日志，显示获取到的模块数据
    console.log(`获取到项目ID${projectId}的${modules.length}个模块, 时间戳: ${_t || '无'}`);

    // 构建树形结构
    const buildTree = (modules, parentId = null) => {
      const tree = [];
      modules.forEach(module => {
        // 处理parentId为null或0的情况
        const moduleParentId = module.parentId === 0 ? null : module.parentId;
        
        if (moduleParentId === parentId) {
          const children = buildTree(modules, module.id);
          if (children.length) {
            module.dataValues.children = children;
          }
          tree.push(module);
        }
      });
      return tree;
    };

    const moduleTree = buildTree(modules);
    
    // 添加缓存控制头，确保前端始终获取最新数据
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      success: true,
      count: modules.length,
      data: moduleTree,
      timestamp: _t || Date.now() // 返回时间戳，方便前端判断数据新鲜度
    });
  } catch (error) {
    console.error('获取模块树错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};